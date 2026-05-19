// ABOUTME: Unit tests for WorkspaceController covering all REST endpoints
// ABOUTME: Uses mocked WorkspaceService following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';

import { WorkspaceController } from './WorkspaceController';
import { WorkspaceService } from '../service/WorkspaceService';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';
import { CreateWorkspacePayloadDto } from '../dto/CreateWorkspacePayloadDto';
import { UpdateWorkspacePayloadDto } from '../dto/UpdateWorkspacePayloadDto';
import { AddWorkspaceMemberPayloadDto } from '../dto/AddWorkspaceMemberPayloadDto';
import { UpdateWorkspaceMemberRolePayloadDto } from '../dto/UpdateWorkspaceMemberRolePayloadDto';
import { WorkspaceDto } from '../dto/WorkspaceDto';
import { WorkspaceMemberDto } from '../dto/WorkspaceMemberDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';

// Stub guard that always allows — guards are tested separately
const allowAllGuard = { canActivate: () => true };

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

describe('WorkspaceController', () => {
  let app: INestApplication;
  let controller: WorkspaceController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addMember: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
  };

  const mockRequest = {
    user: { sub: fakeUserId, organizationId: fakeOrgId },
  } as unknown as Request & { user: { sub: string; organizationId: string } };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [{ provide: WorkspaceService, useValue: mockService }],
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
    controller = module.get<WorkspaceController>(WorkspaceController);
  });

  afterAll(async () => await app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('returns WorkspaceDto on success', async () => {
      mockService.create.mockResolvedValue(fakeWorkspace);
      const dto: CreateWorkspacePayloadDto = { name: 'Marketing' };

      const result = await controller.create(dto, mockRequest);

      expect(result).toBeInstanceOf(WorkspaceDto);
      expect(result.name).toBe('Marketing');
      expect(mockService.create).toHaveBeenCalledWith(dto, fakeOrgId, fakeUserId);
    });
  });

  describe('findAll', () => {
    it('returns array of WorkspaceDto', async () => {
      mockService.findAll.mockResolvedValue([fakeWorkspace]);

      const result = await controller.findAll(mockRequest);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(WorkspaceDto);
      expect(mockService.findAll).toHaveBeenCalledWith(fakeOrgId, fakeUserId);
    });

    it('returns empty array when no workspaces', async () => {
      mockService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns WorkspaceDto when found', async () => {
      mockService.findById.mockResolvedValue(fakeWorkspace);

      const result = await controller.getById(fakeWorkspaceId);

      expect(result).toBeInstanceOf(WorkspaceDto);
      expect(result.name).toBe('Marketing');
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundEntityError('not found', 'Workspace', '404'),
      );

      await expect(controller.getById('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated WorkspaceDto', async () => {
      const updated = { ...fakeWorkspace, name: 'Marketing Updated' };
      mockService.update.mockResolvedValue(updated);
      const dto: UpdateWorkspacePayloadDto = { name: 'Marketing Updated' };

      const result = await controller.update(fakeWorkspaceId, dto);

      expect(result).toBeInstanceOf(WorkspaceDto);
      expect(result.name).toBe('Marketing Updated');
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundEntityError('not found', 'Workspace', '404'),
      );

      await expect(
        controller.update('bad-id', { name: 'X' }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('resolves without value on success', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await expect(controller.delete(fakeWorkspaceId)).resolves.toBeUndefined();
      expect(mockService.delete).toHaveBeenCalledWith(fakeWorkspaceId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.delete.mockRejectedValue(
        new NotFoundEntityError('not found', 'Workspace', '404'),
      );

      await expect(controller.delete('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('addMember', () => {
    it('returns WorkspaceMemberDto on success', async () => {
      mockService.addMember.mockResolvedValue(fakeMember);
      const dto: AddWorkspaceMemberPayloadDto = {
        userId: fakeUserId,
        role: WorkspaceRole.Editor,
      };

      const result = await controller.addMember(fakeWorkspaceId, dto);

      expect(result).toBeInstanceOf(WorkspaceMemberDto);
      expect(mockService.addMember).toHaveBeenCalledWith(fakeWorkspaceId, dto);
    });

    it('propagates DuplicateEntityError', async () => {
      mockService.addMember.mockRejectedValue(
        new DuplicateEntityError('already member', 'WorkspaceMember', '11000'),
      );
      const dto: AddWorkspaceMemberPayloadDto = {
        userId: fakeUserId,
        role: WorkspaceRole.Editor,
      };

      await expect(controller.addMember(fakeWorkspaceId, dto)).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('updateMemberRole', () => {
    it('returns updated WorkspaceMemberDto', async () => {
      const updatedMember = { ...fakeMember, role: WorkspaceRole.Viewer };
      mockService.updateMemberRole.mockResolvedValue(updatedMember);
      const dto: UpdateWorkspaceMemberRolePayloadDto = { role: WorkspaceRole.Viewer };

      const result = await controller.updateMemberRole(fakeWorkspaceId, fakeUserId, dto);

      expect(result).toBeInstanceOf(WorkspaceMemberDto);
      expect(result.role).toBe(WorkspaceRole.Viewer);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.updateMemberRole.mockRejectedValue(
        new NotFoundEntityError('member not found', 'WorkspaceMember', '404'),
      );

      await expect(
        controller.updateMemberRole(fakeWorkspaceId, 'bad-user', { role: WorkspaceRole.Viewer }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('removeMember', () => {
    it('resolves without value on success', async () => {
      mockService.removeMember.mockResolvedValue(undefined);

      await expect(
        controller.removeMember(fakeWorkspaceId, fakeUserId),
      ).resolves.toBeUndefined();
      expect(mockService.removeMember).toHaveBeenCalledWith(fakeWorkspaceId, fakeUserId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.removeMember.mockRejectedValue(
        new NotFoundEntityError('member not found', 'WorkspaceMember', '404'),
      );

      await expect(
        controller.removeMember(fakeWorkspaceId, 'bad-user'),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });
});
