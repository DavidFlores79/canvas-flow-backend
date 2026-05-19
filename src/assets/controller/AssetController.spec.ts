// ABOUTME: Unit tests for AssetController covering all REST endpoints
// ABOUTME: Uses mocked AssetService following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';

import { AssetController } from './AssetController';
import { AssetService } from '../service/AssetService';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { CreateAssetPayloadDto } from '../dto/CreateAssetPayloadDto';
import { UploadAssetPayloadDto } from '../dto/UploadAssetPayloadDto';
import { TransformAssetPayloadDto } from '../dto/TransformAssetPayloadDto';
import { FilterAssetsQueryDto } from '../dto/FilterAssetsQueryDto';
import { AssetDto } from '../dto/AssetDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';

// Stub guard that always allows — guards are tested separately
const allowAllGuard = { canActivate: () => true };

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
  metadata: new Map([['width', 1920]]),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRequest = {
  user: { sub: new Types.ObjectId().toString(), organizationId: fakeOrgId },
} as unknown as Request & { user: { sub: string; organizationId: string } };

describe('AssetController', () => {
  let app: INestApplication;
  let controller: AssetController;

  const mockService = {
    create: jest.fn(),
    upload: jest.fn(),
    transform: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetController],
      providers: [{ provide: AssetService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(TenantGuard)
      .useValue(allowAllGuard)
      .overrideGuard(PoliciesGuard)
      .useValue(allowAllGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
    controller = module.get<AssetController>(AssetController);
  });

  afterAll(async () => await app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('upload', () => {
    const fakeFile = {
      buffer: Buffer.from('fake'),
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('returns AssetDto after uploading file', async () => {
      mockService.upload.mockResolvedValue(fakeAsset);
      const dto: UploadAssetPayloadDto = { workspaceId: fakeWorkspaceId };

      const result = await controller.upload(fakeFile, dto, mockRequest);

      expect(result).toBeInstanceOf(AssetDto);
      expect(mockService.upload).toHaveBeenCalledWith(fakeFile, dto, fakeOrgId);
    });

    it('propagates errors from service', async () => {
      mockService.upload.mockRejectedValue(new Error('upload failed'));
      const dto: UploadAssetPayloadDto = { workspaceId: fakeWorkspaceId };

      await expect(controller.upload(fakeFile, dto, mockRequest)).rejects.toThrow('upload failed');
    });
  });

  describe('transform', () => {
    it('returns new AssetDto after transformation', async () => {
      mockService.transform.mockResolvedValue(fakeAsset);
      const dto: TransformAssetPayloadDto = { workspaceId: fakeWorkspaceId, grayscale: true };

      const result = await controller.transform(fakeAssetId, dto, mockRequest);

      expect(result).toBeInstanceOf(AssetDto);
      expect(mockService.transform).toHaveBeenCalledWith(fakeAssetId, dto, fakeOrgId);
    });

    it('propagates NotFoundEntityError when source asset missing', async () => {
      mockService.transform.mockRejectedValue(
        new NotFoundEntityError('not found', 'Asset', '404'),
      );
      const dto: TransformAssetPayloadDto = { workspaceId: fakeWorkspaceId };

      await expect(controller.transform('bad-id', dto, mockRequest)).rejects.toThrow(
        NotFoundEntityError,
      );
    });
  });

  describe('create', () => {
    it('returns AssetDto on success', async () => {
      mockService.create.mockResolvedValue(fakeAsset);
      const dto: CreateAssetPayloadDto = {
        workspaceId: fakeWorkspaceId,
        cloudinaryPublicId: 'samples/landscape',
        url: 'https://res.cloudinary.com/demo/image/upload/samples/landscape.jpg',
        type: 'image',
      };

      const result = await controller.create(dto, mockRequest);

      expect(result).toBeInstanceOf(AssetDto);
      expect(result.cloudinaryPublicId).toBe('samples/landscape');
      expect(mockService.create).toHaveBeenCalledWith(dto, fakeOrgId);
    });

    it('propagates errors from service', async () => {
      mockService.create.mockRejectedValue(new Error('unexpected'));
      const dto: CreateAssetPayloadDto = {
        workspaceId: fakeWorkspaceId,
        cloudinaryPublicId: 'bad',
        url: 'https://res.cloudinary.com/demo/image/upload/bad.jpg',
        type: 'image',
      };

      await expect(controller.create(dto, mockRequest)).rejects.toThrow('unexpected');
    });
  });

  describe('findAll', () => {
    it('returns array of AssetDto', async () => {
      mockService.findAll.mockResolvedValue([fakeAsset]);
      const query: FilterAssetsQueryDto = {};

      const result = await controller.findAll(query, mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(AssetDto);
      expect(result[0].type).toBe('image');
      expect(mockService.findAll).toHaveBeenCalledWith(fakeOrgId, query);
    });

    it('returns empty array when no assets', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll({}, mockRequest);
      expect(result).toEqual([]);
    });

    it('passes workspaceId filter to service', async () => {
      mockService.findAll.mockResolvedValue([fakeAsset]);
      const query: FilterAssetsQueryDto = { workspaceId: fakeWorkspaceId };

      await controller.findAll(query, mockRequest);

      expect(mockService.findAll).toHaveBeenCalledWith(fakeOrgId, query);
    });
  });

  describe('getById', () => {
    it('returns AssetDto when found', async () => {
      mockService.findById.mockResolvedValue(fakeAsset);

      const result = await controller.getById(fakeAssetId);

      expect(result).toBeInstanceOf(AssetDto);
      expect(result.id).toBe(fakeAssetId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundEntityError('not found', 'Asset', '404'),
      );

      await expect(controller.getById('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('resolves without value on success', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await expect(controller.delete(fakeAssetId)).resolves.toBeUndefined();
      expect(mockService.delete).toHaveBeenCalledWith(fakeAssetId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.delete.mockRejectedValue(
        new NotFoundEntityError('not found', 'Asset', '404'),
      );

      await expect(controller.delete('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });
});
