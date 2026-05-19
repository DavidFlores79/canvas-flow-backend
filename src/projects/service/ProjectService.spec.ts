// ABOUTME: Unit tests for ProjectService covering all CRUD methods and optimistic locking
// ABOUTME: Uses mocked Mongoose models following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { ProjectService } from './ProjectService';
import { Project } from '../schemas/ProjectSchema';
import { CreateProjectPayloadDto } from '../dto/CreateProjectPayloadDto';
import { UpdateProjectPayloadDto } from '../dto/UpdateProjectPayloadDto';
import { FilterProjectsQueryDto } from '../dto/FilterProjectsQueryDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';

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

type MockProjectModel = {
  new (dto: unknown): { save: jest.Mock };
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

const createMockProjectModel = (): MockProjectModel => {
  const MockModel = function (this: Record<string, unknown>, dto: unknown) {
    Object.assign(this, dto);
    this.save = jest.fn().mockResolvedValue(fakeProject);
  } as unknown as MockProjectModel;

  MockModel.find = jest.fn();
  MockModel.findById = jest.fn();
  MockModel.findByIdAndUpdate = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();
  return MockModel;
};

describe('ProjectService', () => {
  let service: ProjectService;
  let projectModel: MockProjectModel;

  beforeAll(async () => {
    projectModel = createMockProjectModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getModelToken(Project.name), useValue: projectModel },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates and returns a project', async () => {
      const dto: CreateProjectPayloadDto = {
        name: 'My Canvas',
        workspaceId: fakeWorkspaceId,
      };

      const result = await service.create(dto, fakeOrgId, fakeUserId);
      expect(result).toEqual(fakeProject);
    });

    it('creates project with custom dimensions', async () => {
      const dto: CreateProjectPayloadDto = {
        name: 'Wide Canvas',
        workspaceId: fakeWorkspaceId,
        width: 1920,
        height: 1080,
      };

      const result = await service.create(dto, fakeOrgId, fakeUserId);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('returns list of projects for a workspace', async () => {
      projectModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([fakeProject]) });

      const query: FilterProjectsQueryDto = { workspaceId: fakeWorkspaceId };
      const result = await service.findAll(query);

      expect(result).toEqual([fakeProject]);
      expect(projectModel.find).toHaveBeenCalledWith({
        workspaceId: new Types.ObjectId(fakeWorkspaceId),
      });
    });

    it('returns empty array when no projects in workspace', async () => {
      projectModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const query: FilterProjectsQueryDto = { workspaceId: fakeWorkspaceId };
      const result = await service.findAll(query);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns project when found', async () => {
      projectModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeProject) });

      const result = await service.findById(fakeProjectId);
      expect(result).toEqual(fakeProject);
      expect(projectModel.findById).toHaveBeenCalledWith(fakeProjectId);
    });

    it('throws NotFoundEntityError when project not found', async () => {
      projectModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated project when version matches', async () => {
      const updatedProject = { ...fakeProject, name: 'Renamed Canvas', version: 1 };
      projectModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeProject) });
      projectModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProject),
      });

      const dto: UpdateProjectPayloadDto = { name: 'Renamed Canvas', version: 0 };
      const result = await service.update(fakeProjectId, dto);

      expect(result.name).toBe('Renamed Canvas');
      expect(projectModel.findByIdAndUpdate).toHaveBeenCalledWith(
        fakeProjectId,
        { $set: { name: 'Renamed Canvas' }, $inc: { version: 1 } },
        { new: true },
      );
    });

    it('throws NotFoundEntityError when project does not exist', async () => {
      projectModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const dto: UpdateProjectPayloadDto = { name: 'X', version: 0 };
      await expect(service.update('nonexistent', dto)).rejects.toThrow(NotFoundEntityError);
    });

    it('throws OutdatedEntityVersionError when version mismatches', async () => {
      projectModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeProject) });

      const dto: UpdateProjectPayloadDto = { name: 'Stale', version: 5 };
      await expect(service.update(fakeProjectId, dto)).rejects.toThrow(OutdatedEntityVersionError);
    });
  });

  describe('delete', () => {
    it('deletes project successfully', async () => {
      projectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeProject),
      });

      await expect(service.delete(fakeProjectId)).resolves.toBeUndefined();
    });

    it('throws NotFoundEntityError when project not found', async () => {
      projectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });
});
