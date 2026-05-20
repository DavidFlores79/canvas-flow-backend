// ABOUTME: Unit tests for LayerService covering all CRUD and bulk-update methods
// ABOUTME: Uses mocked Mongoose models following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { LayerService } from './LayerService';
import { Layer } from '../schemas/LayerSchema';
import { CreateLayerPayloadDto } from '../dto/CreateLayerPayloadDto';
import { UpdateLayerPayloadDto } from '../dto/UpdateLayerPayloadDto';
import { BulkUpdateLayersPayloadDto } from '../dto/BulkUpdateLayersPayloadDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';

const fakeOrgId = new Types.ObjectId().toString();
const fakeProjectId = new Types.ObjectId().toString();
const fakeLayerId = new Types.ObjectId().toString();

const fakeLayer = {
  _id: new Types.ObjectId(fakeLayerId),
  id: fakeLayerId,
  projectId: new Types.ObjectId(fakeProjectId),
  organizationId: new Types.ObjectId(fakeOrgId),
  type: 'text',
  properties: new Map([['x', 0], ['y', 0]]),
  createdAt: new Date(),
  updatedAt: new Date(),
};

type MockLayerModel = {
  new (dto: unknown): { save: jest.Mock };
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findOneAndUpdate: jest.Mock;
  deleteMany: jest.Mock;
};

const createMockLayerModel = (): MockLayerModel => {
  const MockModel = function (this: Record<string, unknown>, dto: unknown) {
    Object.assign(this, dto);
    this.save = jest.fn().mockResolvedValue(fakeLayer);
  } as unknown as MockLayerModel;

  MockModel.find = jest.fn();
  MockModel.findById = jest.fn();
  MockModel.findByIdAndUpdate = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();
  MockModel.findOneAndUpdate = jest.fn();
  MockModel.deleteMany = jest.fn();
  return MockModel;
};

describe('LayerService', () => {
  let service: LayerService;
  let layerModel: MockLayerModel;

  beforeAll(async () => {
    layerModel = createMockLayerModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LayerService,
        { provide: getModelToken(Layer.name), useValue: layerModel },
      ],
    }).compile();

    service = module.get<LayerService>(LayerService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates and returns a layer', async () => {
      const dto: CreateLayerPayloadDto = { type: 'text' };

      const result = await service.create(dto, fakeProjectId, fakeOrgId);
      expect(result).toEqual(fakeLayer);
    });

    it('creates layer with assetId for image type', async () => {
      const fakeAssetId = new Types.ObjectId().toString();
      const dto: CreateLayerPayloadDto = {
        type: 'image',
        assetId: fakeAssetId,
        properties: { x: 10, y: 20 },
      };

      const result = await service.create(dto, fakeProjectId, fakeOrgId);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('returns list of layers for a project', async () => {
      layerModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([fakeLayer]) });

      const result = await service.findAll(fakeProjectId);

      expect(result).toEqual([fakeLayer]);
      expect(layerModel.find).toHaveBeenCalledWith({
        projectId: new Types.ObjectId(fakeProjectId),
      });
    });

    it('returns empty array when no layers', async () => {
      layerModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const result = await service.findAll(fakeProjectId);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns layer when found', async () => {
      layerModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeLayer) });

      const result = await service.findById(fakeLayerId);
      expect(result).toEqual(fakeLayer);
    });

    it('throws NotFoundEntityError when layer not found', async () => {
      layerModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated layer', async () => {
      const updatedLayer = { ...fakeLayer, properties: new Map([['x', 50]]) };
      layerModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedLayer),
      });

      const dto: UpdateLayerPayloadDto = { properties: { x: 50 } };
      const result = await service.update(fakeLayerId, dto);

      expect(result).toBeDefined();
    });

    it('throws NotFoundEntityError when layer not found', async () => {
      layerModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: UpdateLayerPayloadDto = { properties: { x: 10 } };
      await expect(service.update('nonexistent', dto)).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('bulkUpdate', () => {
    it('returns array of updated layers', async () => {
      layerModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeLayer),
      });

      const dto: BulkUpdateLayersPayloadDto = {
        layers: [{ id: fakeLayerId, properties: { x: 100, y: 200 } }],
      };

      const result = await service.bulkUpdate(fakeProjectId, dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fakeLayer);
    });

    it('throws NotFoundEntityError when a layer in bulk update is not found', async () => {
      layerModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: BulkUpdateLayersPayloadDto = {
        layers: [{ id: fakeLayerId, properties: { x: 100 } }],
      };

      await expect(service.bulkUpdate(fakeProjectId, dto)).rejects.toThrow(NotFoundEntityError);
    });

    it('handles bulk update of multiple layers', async () => {
      const secondLayerId = new Types.ObjectId().toString();
      const secondLayer = { ...fakeLayer, _id: new Types.ObjectId(secondLayerId), id: secondLayerId };

      layerModel.findOneAndUpdate
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(fakeLayer) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(secondLayer) });

      const dto: BulkUpdateLayersPayloadDto = {
        layers: [
          { id: fakeLayerId, properties: { x: 10 } },
          { id: secondLayerId, properties: { x: 20 } },
        ],
      };

      const result = await service.bulkUpdate(fakeProjectId, dto);
      expect(result).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('deletes layer successfully', async () => {
      layerModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeLayer),
      });

      await expect(service.delete(fakeLayerId)).resolves.toBeUndefined();
    });

    it('throws NotFoundEntityError when layer not found', async () => {
      layerModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('deleteByProjectId', () => {
    it('deletes all layers for a project', async () => {
      layerModel.deleteMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 3 }) });

      await expect(service.deleteByProjectId(fakeProjectId)).resolves.toBeUndefined();
      expect(layerModel.deleteMany).toHaveBeenCalledWith({
        projectId: new Types.ObjectId(fakeProjectId),
      });
    });

    it('resolves when no layers exist for the project', async () => {
      layerModel.deleteMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 0 }) });

      await expect(service.deleteByProjectId(fakeProjectId)).resolves.toBeUndefined();
    });
  });
});
