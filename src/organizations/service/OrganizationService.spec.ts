// ABOUTME: Unit tests for OrganizationService covering all CRUD and member management methods
// ABOUTME: Uses mocked Mongoose models following the project's established test patterns

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';

import { OrganizationService } from './OrganizationService';
import { Organization } from '../schemas/OrganizationSchema';
import { OrganizationMember } from '../schemas/OrganizationMemberSchema';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { OrgRole } from '../../shared/enum/OrgRole';
import { CreateOrganizationPayloadDto } from '../dto/CreateOrganizationPayloadDto';
import { UpdateOrganizationPayloadDto } from '../dto/UpdateOrganizationPayloadDto';
import { InviteMemberPayloadDto } from '../dto/InviteMemberPayloadDto';
import { UpdateMemberRolePayloadDto } from '../dto/UpdateMemberRolePayloadDto';

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

type MockOrgModel = {
  new (dto: unknown): { save: jest.Mock };
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

type MockMemberModel = {
  new (dto: unknown): { save: jest.Mock };
  find: jest.Mock;
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  findOneAndDelete: jest.Mock;
};

const createMockOrgModel = (): MockOrgModel => {
  const MockModel = function (this: Record<string, unknown>, dto: unknown) {
    Object.assign(this, dto);
    this.save = jest.fn().mockResolvedValue(fakeOrg);
  } as unknown as MockOrgModel;

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
  MockModel.findOne = jest.fn();
  MockModel.findOneAndUpdate = jest.fn();
  MockModel.findOneAndDelete = jest.fn();
  return MockModel;
};

describe('OrganizationService', () => {
  let service: OrganizationService;
  let orgModel: MockOrgModel;
  let memberModel: MockMemberModel;

  beforeAll(async () => {
    orgModel = createMockOrgModel();
    memberModel = createMockMemberModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: getModelToken(Organization.name), useValue: orgModel },
        { provide: getModelToken(OrganizationMember.name), useValue: memberModel },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);

    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates org and assigns owner member', async () => {
      const dto: CreateOrganizationPayloadDto = { name: 'Paisamex', slug: 'paisamex' };
      const result = await service.create(dto, fakeUserId);

      expect(result).toEqual(fakeOrg);
    });

    it('throws DuplicateEntityError on duplicate slug (code 11000)', async () => {
      const dto: CreateOrganizationPayloadDto = { name: 'Paisamex', slug: 'paisamex' };

      const MockModelWithError = function (
        this: Record<string, unknown>,
        _dto: unknown,
      ) {
        this.save = jest.fn().mockRejectedValue({ code: 11000 });
      } as unknown as MockOrgModel;
      MockModelWithError.findById = jest.fn();
      MockModelWithError.findByIdAndUpdate = jest.fn();
      MockModelWithError.findByIdAndDelete = jest.fn();

      const moduleWithError: TestingModule = await Test.createTestingModule({
        providers: [
          OrganizationService,
          { provide: getModelToken(Organization.name), useValue: MockModelWithError },
          { provide: getModelToken(OrganizationMember.name), useValue: memberModel },
        ],
      }).compile();

      const serviceWithError = moduleWithError.get<OrganizationService>(OrganizationService);
      await expect(serviceWithError.create(dto, fakeUserId)).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('findById', () => {
    it('returns organization when found', async () => {
      orgModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(fakeOrg) });

      const result = await service.findById(fakeOrgId);
      expect(result).toEqual(fakeOrg);
      expect(orgModel.findById).toHaveBeenCalledWith(fakeOrgId);
    });

    it('throws NotFoundEntityError when not found', async () => {
      orgModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('update', () => {
    it('returns updated organization', async () => {
      const dto: UpdateOrganizationPayloadDto = { name: 'Paisamex Updated' };
      const updatedOrg = { ...fakeOrg, name: 'Paisamex Updated' };

      orgModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedOrg),
      });

      const result = await service.update(fakeOrgId, dto);
      expect(result.name).toBe('Paisamex Updated');
    });

    it('throws NotFoundEntityError when org not found', async () => {
      orgModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('delete', () => {
    it('deletes organization successfully', async () => {
      orgModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeOrg),
      });

      await expect(service.delete(fakeOrgId)).resolves.toBeUndefined();
    });

    it('throws NotFoundEntityError when org not found', async () => {
      orgModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('findMembers', () => {
    it('returns list of members', async () => {
      memberModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([fakeMember]) });

      const result = await service.findMembers(fakeOrgId);
      expect(result).toEqual([fakeMember]);
      expect(memberModel.find).toHaveBeenCalledWith({
        organizationId: new Types.ObjectId(fakeOrgId),
      });
    });
  });

  describe('inviteMember', () => {
    it('creates and returns new member', async () => {
      const dto: InviteMemberPayloadDto = { userId: fakeUserId, role: OrgRole.Admin };

      const MockMemberSave = function (this: Record<string, unknown>, _dto: unknown) {
        this.save = jest.fn().mockResolvedValue(fakeMember);
      } as unknown as MockMemberModel;
      MockMemberSave.find = jest.fn();
      MockMemberSave.findOne = jest.fn();
      MockMemberSave.findOneAndUpdate = jest.fn();
      MockMemberSave.findOneAndDelete = jest.fn();

      const moduleWithMember: TestingModule = await Test.createTestingModule({
        providers: [
          OrganizationService,
          { provide: getModelToken(Organization.name), useValue: orgModel },
          { provide: getModelToken(OrganizationMember.name), useValue: MockMemberSave },
        ],
      }).compile();

      const svc = moduleWithMember.get<OrganizationService>(OrganizationService);
      const result = await svc.inviteMember(fakeOrgId, dto);
      expect(result).toEqual(fakeMember);
    });

    it('throws DuplicateEntityError on duplicate membership (code 11000)', async () => {
      const dto: InviteMemberPayloadDto = { userId: fakeUserId, role: OrgRole.Admin };

      const MockMemberDup = function (this: Record<string, unknown>, _dto: unknown) {
        this.save = jest.fn().mockRejectedValue({ code: 11000 });
      } as unknown as MockMemberModel;
      MockMemberDup.find = jest.fn();
      MockMemberDup.findOne = jest.fn();
      MockMemberDup.findOneAndUpdate = jest.fn();
      MockMemberDup.findOneAndDelete = jest.fn();

      const moduleWithDup: TestingModule = await Test.createTestingModule({
        providers: [
          OrganizationService,
          { provide: getModelToken(Organization.name), useValue: orgModel },
          { provide: getModelToken(OrganizationMember.name), useValue: MockMemberDup },
        ],
      }).compile();

      const svc = moduleWithDup.get<OrganizationService>(OrganizationService);
      await expect(svc.inviteMember(fakeOrgId, dto)).rejects.toThrow(DuplicateEntityError);
    });
  });

  describe('updateMemberRole', () => {
    it('returns updated member', async () => {
      const dto: UpdateMemberRolePayloadDto = { role: OrgRole.Admin };
      const updatedMember = { ...fakeMember, role: OrgRole.Admin };

      memberModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedMember),
      });

      const result = await service.updateMemberRole(fakeOrgId, fakeUserId, dto);
      expect(result.role).toBe(OrgRole.Admin);
    });

    it('throws NotFoundEntityError when member not found', async () => {
      memberModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const unknownUserId = new Types.ObjectId().toString();
      await expect(
        service.updateMemberRole(fakeOrgId, unknownUserId, { role: OrgRole.Member }),
      ).rejects.toThrow(NotFoundEntityError);
    });
  });

  describe('removeMember', () => {
    it('removes member successfully', async () => {
      memberModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeMember),
      });

      await expect(service.removeMember(fakeOrgId, fakeUserId)).resolves.toBeUndefined();
    });

    it('throws NotFoundEntityError when member not found', async () => {
      memberModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const unknownUserId = new Types.ObjectId().toString();
      await expect(service.removeMember(fakeOrgId, unknownUserId)).rejects.toThrow(NotFoundEntityError);
    });
  });
});
