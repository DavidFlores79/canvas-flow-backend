// ABOUTME: Unit tests for PoliciesGuard covering policy handler evaluation scenarios
// ABOUTME: Verifies correct behavior when no handlers, passing, or failing policies

import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { PoliciesGuard } from './PoliciesGuard';
import { AbilityFactory, AppAbility } from '../factory/AbilityFactory';
import { CHECK_POLICIES_KEY } from '../decorator/CheckPolicies';
import { OrgRole } from '../../shared/enum/OrgRole';

const createMockContext = (user: {
  sub: string;
  organizationId: string;
  orgRole: OrgRole;
}) => {
  const mockRequest = { user, tenantContext: undefined };
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => 'handler',
  } as unknown as ExecutionContext;
};

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;
  let reflector: { get: jest.Mock };
  let abilityFactory: { createForContext: jest.Mock };

  const mockUser = {
    sub: 'user-1',
    organizationId: 'org-1',
    orgRole: OrgRole.Admin,
  };

  beforeEach(async () => {
    reflector = { get: jest.fn() };
    abilityFactory = { createForContext: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        { provide: Reflector, useValue: reflector },
        { provide: AbilityFactory, useValue: abilityFactory },
      ],
    }).compile();

    guard = module.get<PoliciesGuard>(PoliciesGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('returns true when no policy handlers are defined', () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = createMockContext(mockUser);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(abilityFactory.createForContext).not.toHaveBeenCalled();
    });

    it('returns true when handlers array is empty', () => {
      reflector.get.mockReturnValue([]);
      const ctx = createMockContext(mockUser);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('returns true when all policy handlers pass', () => {
      const mockAbility = {} as AppAbility;
      const handlerA = jest.fn().mockReturnValue(true);
      const handlerB = jest.fn().mockReturnValue(true);

      reflector.get.mockReturnValue([handlerA, handlerB]);
      abilityFactory.createForContext.mockReturnValue(mockAbility);

      const ctx = createMockContext(mockUser);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(handlerA).toHaveBeenCalledWith(mockAbility);
      expect(handlerB).toHaveBeenCalledWith(mockAbility);
    });

    it('throws ForbiddenException when a policy handler returns false', () => {
      const mockAbility = {} as AppAbility;
      const handlerA = jest.fn().mockReturnValue(true);
      const handlerB = jest.fn().mockReturnValue(false);

      reflector.get.mockReturnValue([handlerA, handlerB]);
      abilityFactory.createForContext.mockReturnValue(mockAbility);

      const ctx = createMockContext(mockUser);

      expect(() => guard.canActivate(ctx)).toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });

    it('throws ForbiddenException when a single handler fails', () => {
      const mockAbility = {} as AppAbility;
      const handler = jest.fn().mockReturnValue(false);

      reflector.get.mockReturnValue([handler]);
      abilityFactory.createForContext.mockReturnValue(mockAbility);

      const ctx = createMockContext(mockUser);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('passes CHECK_POLICIES_KEY to reflector.get', () => {
      reflector.get.mockReturnValue(undefined);
      const ctx = createMockContext(mockUser);

      guard.canActivate(ctx);

      expect(reflector.get).toHaveBeenCalledWith(CHECK_POLICIES_KEY, 'handler');
    });

    it('builds AuthContext from request.user and tenantContext', () => {
      const mockAbility = {} as AppAbility;
      const handler = jest.fn().mockReturnValue(true);

      reflector.get.mockReturnValue([handler]);
      abilityFactory.createForContext.mockReturnValue(mockAbility);

      const ctx = createMockContext(mockUser);

      guard.canActivate(ctx);

      expect(abilityFactory.createForContext).toHaveBeenCalledWith({
        userId: mockUser.sub,
        organizationId: mockUser.organizationId,
        orgRole: mockUser.orgRole,
        workspaceRole: undefined,
      });
    });
  });
});
