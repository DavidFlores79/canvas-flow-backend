// ABOUTME: Unit tests for OrganizationController covering all REST endpoints
// ABOUTME: Uses mocked OrganizationService following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Types } from 'mongoose';

import { OrganizationController } from './OrganizationController';
import { OrganizationService } from '../service/OrganizationService';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { OrgRole } from '../../shared/enum/OrgRole';
import { CreateOrganizationPayloadDto } from '../dto/CreateOrganizationPayloadDto';
import { UpdateOrganizationPayloadDto } from '../dto/UpdateOrganizationPayloadDto';
import { InviteMemberPayloadDto } from '../dto/InviteMemberPayloadDto';
import { UpdateMemberRolePayloadDto } from '../dto/UpdateMemberRolePayloadDto';
import { OrganizationDto } from '../dto/OrganizationDto';
import { OrganizationMemberDto } from '../dto/OrganizationMemberDto';
import { JwtAuthGuard } from '../../auth/guard/JwtAuthGuard';
import { TenantGuard } from '../../casl/guard/TenantGuard';
import { PoliciesGuard } from '../../casl/guard/PoliciesGuard';

// Stub guard that always allows — guards are tested separately
const allowAllGuard = { canActivate: () => true };

const fakeOrgId = new Types.ObjectId().toString();
const fakeUserId = new Types.ObjectId().toString();

const fakeOrg = {
  _id: new Types.ObjectId(fakeOrgId),
  id: fakeOrgId,
  name: 'Paisamex',
  slug: 'paisamex',
  ownerId: new Types.ObjectId(fakeUserId),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeMember = {
  _id: new Types.ObjectId(),
  organizationId: new Types.ObjectId(fakeOrgId),
  userId: new Types.ObjectId(fakeUserId),
  role: OrgRole.Owner,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OrganizationController', () => {
  let app: INestApplication;
  let controller: OrganizationController;

  const mockService = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMembers: jest.fn(),
    inviteMember: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
  };

  const mockRequest = {
    user: { sub: fakeUserId, organizationId: fakeOrgId },
  } as unknown as Request & { user: { sub: string; organizationId: string } };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [{ provide: OrganizationService, useValue: mockService }],
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
    controller = module.get<OrganizationController>(OrganizationController);
  });

  afterAll(async () => await app.close());
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('returns OrganizationDto on success', async () => {
      mockService.create.mockResolvedValue(fakeOrg);
      const dto: CreateOrganizationPayloadDto = { name: 'Paisamex', slug: 'paisamex' };

      const result = await controller.create(dto, mockRequest);

      expect(result).toBeInstanceOf(OrganizationDto);
      expect(result.name).toBe('Paisamex');
      expect(mockService.create).toHaveBeenCalledWith(dto, fakeUserId);
    });

    it('propagates DuplicateEntityError', async () => {
      mockService.create.mockRejectedValue(
        new DuplicateEntityError('slug taken', 'Organization', '11000'),
      );
      const dto: CreateOrganizationPayloadDto = { name: 'Dup', slug: 'dup' };

      await expect(controller.create(dto, mockRequest)).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('getById', () => {
    it('returns OrganizationDto when found', async () => {
      mockService.findById.mockResolvedValue(fakeOrg);

      const result = await controller.getById(fakeOrgId);

      expect(result).toBeInstanceOf(OrganizationDto);
      expect(result.slug).toBe('paisamex');
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundEntityError('not found', 'Organization', '404'),
      );

      await expect(controller.getById('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated OrganizationDto', async () => {
      const updated = { ...fakeOrg, name: 'Paisamex Corp' };
      mockService.update.mockResolvedValue(updated);
      const dto: UpdateOrganizationPayloadDto = { name: 'Paisamex Corp' };

      const result = await controller.update(fakeOrgId, dto);

      expect(result).toBeInstanceOf(OrganizationDto);
      expect(result.name).toBe('Paisamex Corp');
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundEntityError('not found', 'Organization', '404'),
      );

      await expect(
        controller.update('bad-id', { name: 'X' }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('resolves without value on success', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await expect(controller.delete(fakeOrgId)).resolves.toBeUndefined();
      expect(mockService.delete).toHaveBeenCalledWith(fakeOrgId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.delete.mockRejectedValue(
        new NotFoundEntityError('not found', 'Organization', '404'),
      );

      await expect(controller.delete('bad-id')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('getMembers', () => {
    it('returns array of OrganizationMemberDto', async () => {
      mockService.findMembers.mockResolvedValue([fakeMember]);

      const result = await controller.getMembers(fakeOrgId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OrganizationMemberDto);
      expect(result[0].role).toBe(OrgRole.Owner);
    });
  });

  describe('inviteMember', () => {
    it('returns OrganizationMemberDto on success', async () => {
      mockService.inviteMember.mockResolvedValue(fakeMember);
      const dto: InviteMemberPayloadDto = { userId: fakeUserId, role: OrgRole.Admin };

      const result = await controller.inviteMember(fakeOrgId, dto);

      expect(result).toBeInstanceOf(OrganizationMemberDto);
      expect(mockService.inviteMember).toHaveBeenCalledWith(fakeOrgId, dto);
    });

    it('propagates DuplicateEntityError', async () => {
      mockService.inviteMember.mockRejectedValue(
        new DuplicateEntityError('already member', 'OrganizationMember', '11000'),
      );
      const dto: InviteMemberPayloadDto = { userId: fakeUserId, role: OrgRole.Admin };

      await expect(controller.inviteMember(fakeOrgId, dto)).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('updateMemberRole', () => {
    it('returns updated OrganizationMemberDto', async () => {
      const updatedMember = { ...fakeMember, role: OrgRole.Admin };
      mockService.updateMemberRole.mockResolvedValue(updatedMember);
      const dto: UpdateMemberRolePayloadDto = { role: OrgRole.Admin };

      const result = await controller.updateMemberRole(fakeOrgId, fakeUserId, dto);

      expect(result).toBeInstanceOf(OrganizationMemberDto);
      expect(result.role).toBe(OrgRole.Admin);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.updateMemberRole.mockRejectedValue(
        new NotFoundEntityError('member not found', 'OrganizationMember', '404'),
      );

      await expect(
        controller.updateMemberRole(fakeOrgId, 'bad-user', { role: OrgRole.Member }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('removeMember', () => {
    it('resolves without value on success', async () => {
      mockService.removeMember.mockResolvedValue(undefined);

      await expect(
        controller.removeMember(fakeOrgId, fakeUserId),
      ).resolves.toBeUndefined();
      expect(mockService.removeMember).toHaveBeenCalledWith(fakeOrgId, fakeUserId);
    });

    it('propagates NotFoundEntityError', async () => {
      mockService.removeMember.mockRejectedValue(
        new NotFoundEntityError('member not found', 'OrganizationMember', '404'),
      );

      await expect(
        controller.removeMember(fakeOrgId, 'bad-user'),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });
});
