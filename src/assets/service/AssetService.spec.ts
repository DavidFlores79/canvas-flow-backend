// ABOUTME: Unit tests for AssetService covering create, findAll, findById, and delete
// ABOUTME: Uses mocked Mongoose models following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { AssetService } from './AssetService';
import { Asset } from '../schemas/AssetSchema';
import { CreateAssetPayloadDto } from '../dto/CreateAssetPayloadDto';
import { FilterAssetsQueryDto } from '../dto/FilterAssetsQueryDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';

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
    });

    it('throws NotFoundEntityError when asset not found', async () => {
      assetModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });
});
