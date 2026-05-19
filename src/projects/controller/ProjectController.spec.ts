// ABOUTME: Unit tests for ProjectController covering all REST endpoints
// ABOUTME: Uses mocked ProjectService following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';

import { ProjectController } from './ProjectController';
import { ProjectService } from '../service/ProjectService';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { CreateProjectPayloadDto } from '../dto/CreateProjectPayloadDto';
import { UpdateProjectPayloadDto } from '../dto/UpdateProjectPayloadDto';
import { FilterProjectsQueryDto } from '../dto/FilterProjectsQueryDto';
import { ProjectDto } from '../dto/ProjectDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';

// Stub guard that always allows — guards are tested separately
const allowAllGuard = { canActivate: () => true };

const fakeOrgId = new Types.ObjectId().toString();
const fakeWorkspaceId = new Types.ObjectId().toString();
const fakeUserId = new Types.ObjectId().toString();
const fakeProjectId = new Types.ObjectId().toString();

const fakeProject = {
  _id: new Types.ObjectId(fakeProjectId),
  id: fakeProjectId,
  organizationId: new Types.ObjectId(fakeOrgId),
  workspaceId: new Types.ObjectId(fakeWorkspaceId),
  ownerId: new Types.ObjectId(fakeUserId),
  name: 'My Canvas',
  width: 800,
  height: 600,
  version: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRequest = {
  user: { sub: fakeUserId, organizationId: fakeOrgId },
} as unknown as Request & { user: { sub: string; organizationId: string } };

describe('ProjectController', () => {
  let app: INestApplication;
  let controller: ProjectController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: mockService }],
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
    controller = module.get<ProjectController>(ProjectController);
  });

  afterAll(async () => await app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('returns ProjectDto on success', async () => {
      mockService.create.mockResolvedValue(fakeProject);
      const dto: CreateProjectPayloadDto = { name: 'My Canvas', workspaceId: fakeWorkspaceId };

      const result = await controller.create(dto, mockRequest);

      expect(result).toBeInstanceOf(ProjectDto);
      expect(result.name).toBe('My Canvas');
      expect(mockService.create).toHaveBeenCalledWith(dto, fakeOrgId, fakeUserId);
    });

    it('propagates errors from service', async () => {
      mockService.create.mockRejectedValue(new Error('unexpected'));
      const dto: CreateProjectPayloadDto = { name: 'Bad', workspaceId: fakeWorkspaceId };

      await expect(controller.create(dto, mockRequest)).rejects.toThrow('unexpected');
    });
  });

  describe('findAll', () => {
    it('returns array of ProjectDto', async () => {
      mockService.findAll.mockResolvedValue([fakeProject]);
      const query: FilterProjectsQueryDto = { workspaceId: fakeWorkspaceId };

      const result = await controller.findAll(query);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ProjectDto);
      expect(result[0].name).toBe('My Canvas');
    });

    it('returns empty array when no projects', async () => {
      mockService.findAll.mockResolvedValue([]);
      const query: FilterProjectsQueryDto = { workspaceId: fakeWorkspaceId };

      const result = await controller.findAll(query);
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns ProjectDto when found', async () => {
      mockService.findById.mockResolvedValue(fakeProject);

      const result = await controller.getById(fakeProjectId);

      expect(result).toBeInstanceOf(ProjectDto);
      expect(result.id).toBe(fakeProjectId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundEntityError('not found', 'Project', '404'),
      );

      await expect(controller.getById('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated ProjectDto', async () => {
      const updated = { ...fakeProject, name: 'Renamed', version: 1 };
      mockService.update.mockResolvedValue(updated);
      const dto: UpdateProjectPayloadDto = { name: 'Renamed', version: 0 };

      const result = await controller.update(fakeProjectId, dto);

      expect(result).toBeInstanceOf(ProjectDto);
      expect(result.name).toBe('Renamed');
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundEntityError('not found', 'Project', '404'),
      );

      await expect(
        controller.update('bad-id', { name: 'X', version: 0 }),
      ).rejects.toThrow(NotFoundEntityError);
    });

    it('propagates OutdatedEntityVersionError on version conflict', async () => {
      mockService.update.mockRejectedValue(
        new OutdatedEntityVersionError('version conflict', 'Project', '409'),
      );

      await expect(
        controller.update(fakeProjectId, { version: 5 }),
      ).rejects.toThrow(OutdatedEntityVersionError);
    });
  });

  describe('delete', () => {
    it('resolves without value on success', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await expect(controller.delete(fakeProjectId)).resolves.toBeUndefined();
      expect(mockService.delete).toHaveBeenCalledWith(fakeProjectId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.delete.mockRejectedValue(
        new NotFoundEntityError('not found', 'Project', '404'),
      );

      await expect(controller.delete('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });
});
