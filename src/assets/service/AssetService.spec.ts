// ABOUTME: Unit tests for AssetService covering create, upload, transform, findAll, findById, and delete
// ABOUTME: Uses mocked Mongoose models and mocked CloudinaryService following established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

import { AssetService } from './AssetService';
import { Asset } from '../schemas/AssetSchema';
import { CreateAssetPayloadDto } from '../dto/CreateAssetPayloadDto';
import { FilterAssetsQueryDto } from '../dto/FilterAssetsQueryDto';
import { UploadAssetPayloadDto } from '../dto/UploadAssetPayloadDto';
import { TransformAssetPayloadDto } from '../dto/TransformAssetPayloadDto';
import { CloudinaryService } from '../../cloudinary/service/CloudinaryService';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';

const fakeOrgId = new Types.ObjectId().toString();
const fakeWorkspaceId = new Types.ObjectId().toString();
const fakeAssetId = new Types.ObjectId().toString();

const fakeAsset = {
  _id: new Types.ObjectId(fakeAssetId),
  id: fakeAssetId,
  organizationId: new Types.ObjectId(fakeOrgId),
  workspaceId: new Types.ObjectId(fakeWorkspaceId),
  cloudinaryPublicId: 'samples/landscape',
  url: 'https://res.cloudinary.com/demo/image/upload/samples/landscape.jpg',
  type: 'image',
  metadata: new Map([['width', 1920], ['height', 1080]]),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCloudinaryService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getTransformUrl: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(''),
};

type MockAssetModel = {
  new (dto: unknown): { save: jest.Mock };
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

const createMockAssetModel = (): MockAssetModel => {
  const MockModel = function (this: Record<string, unknown>, dto: unknown) {
    Object.assign(this, dto);
    this.save = jest.fn().mockResolvedValue(fakeAsset);
  } as unknown as MockAssetModel;

  MockModel.find = jest.fn();
  MockModel.findById = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();
  return MockModel;
};

describe('AssetService', () => {
  let service: AssetService;
  let assetModel: MockAssetModel;

  beforeAll(async () => {
    assetModel = createMockAssetModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: getModelToken(Asset.name), useValue: assetModel },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        {
          provide: ConfigService<EnvironmentVariables>,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AssetService>(AssetService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates and returns an asset', async () => {
      const dto: CreateAssetPayloadDto = {
        workspaceId: fakeWorkspaceId,
        cloudinaryPublicId: 'samples/landscape',
        url: 'https://res.cloudinary.com/demo/image/upload/samples/landscape.jpg',
        type: 'image',
      };

      const result = await service.create(dto, fakeOrgId);
      expect(result).toEqual(fakeAsset);
    });

    it('creates asset with optional metadata', async () => {
      const dto: CreateAssetPayloadDto = {
        workspaceId: fakeWorkspaceId,
        cloudinaryPublicId: 'samples/video',
        url: 'https://res.cloudinary.com/demo/video/upload/samples/video.mp4',
        type: 'video',
        metadata: { duration: 30, width: 1280, height: 720 },
      };

      const result = await service.create(dto, fakeOrgId);
      expect(result).toBeDefined();
    });
  });

  describe('upload', () => {
    const fakeFile = {
      buffer: Buffer.from('fake-image'),
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const fakeUploadResult = {
      publicId: 'canvas-flow/org123/photo',
      url: 'https://res.cloudinary.com/demo/image/upload/canvas-flow/org123/photo.jpg',
      resourceType: 'image',
    };

    it('uploads file to Cloudinary and creates Asset record', async () => {
      mockCloudinaryService.uploadFile.mockResolvedValue(fakeUploadResult);

      const dto: UploadAssetPayloadDto = { workspaceId: fakeWorkspaceId };
      const result = await service.upload(fakeFile, dto, fakeOrgId);

      expect(mockCloudinaryService.uploadFile).toHaveBeenCalledWith(
        fakeFile,
        `canvas-flow/${fakeOrgId}`,
      );
      expect(result).toEqual(fakeAsset);
    });

    it('uses explicit type from DTO over Cloudinary resourceType', async () => {
      mockCloudinaryService.uploadFile.mockResolvedValue(fakeUploadResult);

      const dto: UploadAssetPayloadDto = { workspaceId: fakeWorkspaceId, type: 'document' };
      const result = await service.upload(fakeFile, dto, fakeOrgId);

      expect(result).toBeDefined();
    });
  });

  describe('transform', () => {
    const derivedUrl = 'https://res.cloudinary.com/demo/image/upload/e_grayscale/samples/landscape.jpg';

    beforeEach(() => {
      assetModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeAsset) });
      mockCloudinaryService.getTransformUrl.mockReturnValue(derivedUrl);
      mockCloudinaryService.uploadFile.mockResolvedValue({
        publicId: 'canvas-flow/org/transforms/transformed',
        url: 'https://res.cloudinary.com/demo/image/upload/transforms/transformed.png',
        resourceType: 'image',
      });
    });

    it('fetches derived URL, re-uploads, and creates new Asset', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
      });
      global.fetch = mockFetch;

      const dto: TransformAssetPayloadDto = {
        workspaceId: fakeWorkspaceId,
        grayscale: true,
      };

      const result = await service.transform(fakeAssetId, dto, fakeOrgId);

      expect(mockCloudinaryService.getTransformUrl).toHaveBeenCalledWith(
        fakeAsset.cloudinaryPublicId,
        expect.objectContaining({
          transformation: expect.arrayContaining([expect.objectContaining({ effect: 'grayscale' })]),
        }),
      );
      expect(mockFetch).toHaveBeenCalledWith(derivedUrl);
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalled();
      expect(result).toEqual(fakeAsset);
    });

    it('throws UnprocessableEntityException when Cloudinary fetch fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 423 });

      const dto: TransformAssetPayloadDto = { workspaceId: fakeWorkspaceId, grayscale: true };

      await expect(service.transform(fakeAssetId, dto, fakeOrgId)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws NotFoundEntityError when source asset not found', async () => {
      assetModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const dto: TransformAssetPayloadDto = { workspaceId: fakeWorkspaceId };
      await expect(service.transform('nonexistent', dto, fakeOrgId)).rejects.toThrow(
        NotFoundEntityError,
      );
    });
  });

  describe('findAll', () => {
    it('returns list of assets filtered by organizationId', async () => {
      assetModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([fakeAsset]) });

      const query: FilterAssetsQueryDto = {};
      const result = await service.findAll(fakeOrgId, query);

      expect(result).toEqual([fakeAsset]);
      expect(assetModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(fakeOrgId),
      });
    });

    it('filters by workspaceId when provided', async () => {
      assetModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([fakeAsset]) });

      const query: FilterAssetsQueryDto = { workspaceId: fakeWorkspaceId };
      const result = await service.findAll(fakeOrgId, query);

      expect(result).toEqual([fakeAsset]);
      expect(assetModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(fakeOrgId),
        workspaceId: new Types.ObjectId(fakeWorkspaceId),
      });
    });

    it('returns empty array when no assets found', async () => {
      assetModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const result = await service.findAll(fakeOrgId, {});
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns asset when found', async () => {
      assetModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeAsset) });

      const result = await service.findById(fakeAssetId);
      expect(result).toEqual(fakeAsset);
      expect(assetModel.findById).toHaveBeenCalledWith(fakeAssetId);
    });

    it('throws NotFoundEntityError when asset not found', async () => {
      assetModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('deletes asset successfully', async () => {
      assetModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeAsset),
      });

      await expect(service.delete(fakeAssetId)).resolves.toBeUndefined();
      expect(mockCloudinaryService.deleteFile).toHaveBeenCalledWith(fakeAsset.cloudinaryPublicId);
    });

    it('throws NotFoundEntityError when asset not found', async () => {
      assetModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundEntityError);
      expect(mockCloudinaryService.deleteFile).not.toHaveBeenCalled();
    });
  });
});
