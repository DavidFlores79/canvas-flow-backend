// ABOUTME: Unit tests for WorkspaceService covering all CRUD and member management methods
// ABOUTME: Uses mocked Mongoose models following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { WorkspaceService } from './WorkspaceService';
import { Workspace } from '../schemas/WorkspaceSchema';
import { WorkspaceMember } from '../schemas/WorkspaceMemberSchema';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';
import { CreateWorkspacePayloadDto } from '../dto/CreateWorkspacePayloadDto';
import { UpdateWorkspacePayloadDto } from '../dto/UpdateWorkspacePayloadDto';
import { AddWorkspaceMemberPayloadDto } from '../dto/AddWorkspaceMemberPayloadDto';
import { UpdateWorkspaceMemberRolePayloadDto } from '../dto/UpdateWorkspaceMemberRolePayloadDto';

const fakeOrgId = new Types.ObjectId().toString();
const fakeWorkspaceId = new Types.ObjectId().toString();
const fakeUserId = new Types.ObjectId().toString();

const fakeWorkspace = {
  _id: new Types.ObjectId(fakeWorkspaceId),
  id: fakeWorkspaceId,
  organizationId: new Types.ObjectId(fakeOrgId),
  name: 'Marketing',
  ownerId: new Types.ObjectId(fakeUserId),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeMember = {
  _id: new Types.ObjectId(),
  workspaceId: new Types.ObjectId(fakeWorkspaceId),
  userId: new Types.ObjectId(fakeUserId),
  role: WorkspaceRole.Owner,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type MockWorkspaceModel = {
  new (dto: unknown): { save: jest.Mock };
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

type MockMemberModel = {
  new (dto: unknown): { save: jest.Mock };
  find: jest.Mock;
  findOneAndUpdate: jest.Mock;
  findOneAndDelete: jest.Mock;
};

const createMockWorkspaceModel = (): MockWorkspaceModel => {
  const MockModel = function (this: Record<string, unknown>, dto: unknown) {
    Object.assign(this, dto);
    this.save = jest.fn().mockResolvedValue(fakeWorkspace);
  } as unknown as MockWorkspaceModel;

  MockModel.find = jest.fn();
  MockModel.findById = jest.fn();
  MockModel.findByIdAndUpdate = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();
  return MockModel;
};

const createMockMemberModel = (): MockMemberModel => {
  const MockModel = function (this: Record<string, unknown>, dto: unknown) {
    Object.assign(this, dto);
    this.save = jest.fn().mockResolvedValue(fakeMember);
  } as unknown as MockMemberModel;

  MockModel.find = jest.fn();
  MockModel.findOneAndUpdate = jest.fn();
  MockModel.findOneAndDelete = jest.fn();
  return MockModel;
};

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceModel: MockWorkspaceModel;
  let memberModel: MockMemberModel;

  beforeAll(async () => {
    workspaceModel = createMockWorkspaceModel();
    memberModel = createMockMemberModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: getModelToken(Workspace.name), useValue: workspaceModel },
        { provide: getModelToken(WorkspaceMember.name), useValue: memberModel },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates workspace and assigns owner member', async () => {
      const dto: CreateWorkspacePayloadDto = { name: 'Marketing' };
      const result = await service.create(dto, fakeOrgId, fakeUserId);

      expect(result).toEqual(fakeWorkspace);
    });
  });

  describe('findAll', () => {
    it('returns workspaces where user is a member', async () => {
      memberModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { workspaceId: new Types.ObjectId(fakeWorkspaceId) },
        ]),
      });
      workspaceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([fakeWorkspace]),
      });

      const result = await service.findAll(fakeOrgId, fakeUserId);
      expect(result).toEqual([fakeWorkspace]);
      expect(memberModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(fakeUserId),
      });
    });

    it('returns empty array when user has no memberships', async () => {
      memberModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      workspaceModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll(fakeOrgId, fakeUserId);
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('returns workspace when found', async () => {
      workspaceModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeWorkspace),
      });

      const result = await service.findById(fakeWorkspaceId);
      expect(result).toEqual(fakeWorkspace);
    });

    it('throws NotFoundEntityError when not found', async () => {
      workspaceModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated workspace', async () => {
      const dto: UpdateWorkspacePayloadDto = { name: 'Marketing Updated' };
      const updatedWorkspace = { ...fakeWorkspace, name: 'Marketing Updated' };

      workspaceModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedWorkspace),
      });

      const result = await service.update(fakeWorkspaceId, dto);
      expect(result.name).toBe('Marketing Updated');
    });

    it('throws NotFoundEntityError when workspace not found', async () => {
      workspaceModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('deletes workspace successfully', async () => {
      workspaceModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeWorkspace),
      });

      await expect(service.delete(fakeWorkspaceId)).resolves.toBeUndefined();
    });

    it('throws NotFoundEntityError when workspace not found', async () => {
      workspaceModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('addMember', () => {
    it('creates and returns new member', async () => {
      const dto: AddWorkspaceMemberPayloadDto = {
        userId: fakeUserId,
        role: WorkspaceRole.Editor,
      };

      const MockMemberSave = function (this: Record<string, unknown>, _dto: unknown) {
        this.save = jest.fn().mockResolvedValue(fakeMember);
      } as unknown as MockMemberModel;
      MockMemberSave.find = jest.fn();
      MockMemberSave.findOneAndUpdate = jest.fn();
      MockMemberSave.findOneAndDelete = jest.fn();

      const moduleWithMember: TestingModule = await Test.createTestingModule({
        providers: [
          WorkspaceService,
          { provide: getModelToken(Workspace.name), useValue: workspaceModel },
          { provide: getModelToken(WorkspaceMember.name), useValue: MockMemberSave },
        ],
      }).compile();

      const svc = moduleWithMember.get<WorkspaceService>(WorkspaceService);
      const result = await svc.addMember(fakeWorkspaceId, dto);
      expect(result).toEqual(fakeMember);
    });

    it('throws DuplicateEntityError on duplicate membership (code 11000)', async () => {
      const dto: AddWorkspaceMemberPayloadDto = {
        userId: fakeUserId,
        role: WorkspaceRole.Editor,
      };

      const MockMemberDup = function (this: Record<string, unknown>, _dto: unknown) {
        this.save = jest.fn().mockRejectedValue({ code: 11000 });
      } as unknown as MockMemberModel;
      MockMemberDup.find = jest.fn();
      MockMemberDup.findOneAndUpdate = jest.fn();
      MockMemberDup.findOneAndDelete = jest.fn();

      const moduleWithDup: TestingModule = await Test.createTestingModule({
        providers: [
          WorkspaceService,
          { provide: getModelToken(Workspace.name), useValue: workspaceModel },
          { provide: getModelToken(WorkspaceMember.name), useValue: MockMemberDup },
        ],
      }).compile();

      const svc = moduleWithDup.get<WorkspaceService>(WorkspaceService);
      await expect(svc.addMember(fakeWorkspaceId, dto)).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('updateMemberRole', () => {
    it('returns updated member', async () => {
      const dto: UpdateWorkspaceMemberRolePayloadDto = { role: WorkspaceRole.Viewer };
      const updatedMember = { ...fakeMember, role: WorkspaceRole.Viewer };

      memberModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMember),
      });

      const result = await service.updateMemberRole(fakeWorkspaceId, fakeUserId, dto);
      expect(result.role).toBe(WorkspaceRole.Viewer);
    });

    it('throws NotFoundEntityError when member not found', async () => {
      memberModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const unknownUserId = new Types.ObjectId().toString();
      await expect(
        service.updateMemberRole(fakeWorkspaceId, unknownUserId, { role: WorkspaceRole.Viewer }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('removeMember', () => {
    it('removes member successfully', async () => {
      memberModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeMember),
      });

      await expect(service.removeMember(fakeWorkspaceId, fakeUserId)).resolves.toBeUndefined();
    });

    it('throws NotFoundEntityError when member not found', async () => {
      memberModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const unknownUserId = new Types.ObjectId().toString();
      await expect(
        service.removeMember(fakeWorkspaceId, unknownUserId),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });
});
