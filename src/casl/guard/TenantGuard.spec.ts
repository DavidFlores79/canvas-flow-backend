// ABOUTME: Unit tests for TenantGuard covering membership validation scenarios
// ABOUTME: Verifies ForbiddenException is thrown on missing context or non-member

import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { TenantGuard } from './TenantGuard';
import {
  OrganizationMember,
} from '../../organizations/schemas/OrganizationMemberSchema';
import { OrgRole } from '../../shared/enum/OrgRole';

const mockMembership = {
  _id: new Types.ObjectId(),
  userId: new Types.ObjectId(),
  organizationId: new Types.ObjectId(),
  role: OrgRole.Member,
};

const createMockModel = () => ({
  findOne: jest.fn(),
});

const createMockContext = (user: { sub?: string; organizationId?: string }) => {
  const mockRequest = { user, tenantContext: undefined as OrganizationMember | undefined };
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    mockRequest,
  } as unknown as ExecutionContext & { mockRequest: typeof mockRequest };
};

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let memberModel: ReturnType<typeof createMockModel>;

  beforeEach(async () => {
    memberModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: memberModel,
        },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('attaches membership to request.tenantContext when membership found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMembership),
      });
      memberModel.findOne.mockReturnValue({ lean: leanMock });

      const ctx = createMockContext({
        sub: mockMembership.userId.toString(),
        organizationId: mockMembership.organizationId.toString(),
      });

      const result = await guard.canActivate(ctx as unknown as ExecutionContext);

      expect(result).toBe(true);
      expect(ctx.mockRequest.tenantContext).toEqual(mockMembership);
      expect(memberModel.findOne).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
        organizationId: expect.any(Types.ObjectId),
      });
    });

    it('throws ForbiddenException when sub is missing', async () => {
      const ctx = createMockContext({ organizationId: 'org-1' });

      await expect(
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when organizationId is missing', async () => {
      const ctx = createMockContext({ sub: 'user-1' });

      await expect(
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when membership not found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      memberModel.findOne.mockReturnValue({ lean: leanMock });

      const ctx = createMockContext({
        sub: new Types.ObjectId().toString(),
        organizationId: new Types.ObjectId().toString(),
      });

      await expect(
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).rejects.toThrow(new ForbiddenException('Not a member of this organization'));
    });
  });
});
