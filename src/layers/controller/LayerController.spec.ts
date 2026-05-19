// ABOUTME: Unit tests for LayerController covering all REST endpoints
// ABOUTME: Uses mocked LayerService following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';

import { LayerController } from './LayerController';
import { LayerService } from '../service/LayerService';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { CreateLayerPayloadDto } from '../dto/CreateLayerPayloadDto';
import { UpdateLayerPayloadDto } from '../dto/UpdateLayerPayloadDto';
import { BulkUpdateLayersPayloadDto } from '../dto/BulkUpdateLayersPayloadDto';
import { LayerDto } from '../dto/LayerDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';

// Stub guard that always allows — guards are tested separately
const allowAllGuard = { canActivate: () => true };

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

const mockRequest = {
  user: { sub: new Types.ObjectId().toString(), organizationId: fakeOrgId },
} as unknown as Request & { user: { sub: string; organizationId: string } };

describe('LayerController', () => {
  let app: INestApplication;
  let controller: LayerController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    bulkUpdate: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LayerController],
      providers: [{ provide: LayerService, useValue: mockService }],
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
    controller = module.get<LayerController>(LayerController);
  });

  afterAll(async () => await app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('returns LayerDto on success', async () => {
      mockService.create.mockResolvedValue(fakeLayer);
      const dto: CreateLayerPayloadDto = { type: 'text' };

      const result = await controller.create(fakeProjectId, dto, mockRequest);

      expect(result).toBeInstanceOf(LayerDto);
      expect(result.type).toBe('text');
      expect(mockService.create).toHaveBeenCalledWith(dto, fakeProjectId, fakeOrgId);
    });

    it('propagates errors from service', async () => {
      mockService.create.mockRejectedValue(new Error('unexpected'));
      const dto: CreateLayerPayloadDto = { type: 'shape' };

      await expect(controller.create(fakeProjectId, dto, mockRequest)).rejects.toThrow('unexpected');
    });
  });

  describe('findAll', () => {
    it('returns array of LayerDto', async () => {
      mockService.findAll.mockResolvedValue([fakeLayer]);

      const result = await controller.findAll(fakeProjectId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LayerDto);
      expect(result[0].type).toBe('text');
    });

    it('returns empty array when no layers', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(fakeProjectId);
      expect(result).toEqual([]);
    });
  });

  describe('bulkUpdate', () => {
    it('returns array of updated LayerDto', async () => {
      mockService.bulkUpdate.mockResolvedValue([fakeLayer]);
      const dto: BulkUpdateLayersPayloadDto = {
        layers: [{ id: fakeLayerId, properties: { x: 100 } }],
      };

      const result = await controller.bulkUpdate(fakeProjectId, dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LayerDto);
      expect(mockService.bulkUpdate).toHaveBeenCalledWith(fakeProjectId, dto);
    });

    it('propagates NotFoundEntityError when layer missing', async () => {
      mockService.bulkUpdate.mockRejectedValue(
        new NotFoundEntityError('layer not found', 'Layer', '404'),
      );
      const dto: BulkUpdateLayersPayloadDto = {
        layers: [{ id: fakeLayerId, properties: { x: 0 } }],
      };

      await expect(controller.bulkUpdate(fakeProjectId, dto)).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated LayerDto', async () => {
      const updatedLayer = { ...fakeLayer, type: 'shape' };
      mockService.update.mockResolvedValue(updatedLayer);
      const dto: UpdateLayerPayloadDto = { type: 'shape' };

      const result = await controller.update(fakeLayerId, dto);

      expect(result).toBeInstanceOf(LayerDto);
      expect(result.type).toBe('shape');
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundEntityError('not found', 'Layer', '404'),
      );

      await expect(
        controller.update('bad-id', { properties: { x: 0 } }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('resolves without value on success', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await expect(controller.delete(fakeLayerId)).resolves.toBeUndefined();
      expect(mockService.delete).toHaveBeenCalledWith(fakeLayerId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.delete.mockRejectedValue(
        new NotFoundEntityError('not found', 'Layer', '404'),
      );

      await expect(controller.delete('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });
});
