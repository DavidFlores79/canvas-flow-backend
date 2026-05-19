// ABOUTME: Guard that evaluates CASL policies defined via @CheckPolicies decorator
// ABOUTME: Builds AppAbility from tenantContext and checks each policy handler

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AbilityFactory, AppAbility } from '../factory/AbilityFactory';
import { CHECK_POLICIES_KEY } from '../decorator/CheckPolicies';
import { PolicyHandler } from '../interface/PolicyHandler';
import { OrgRole } from '../../shared/enum/OrgRole';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';
import { AuthContext } from '../interface/AuthContext';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const handlers = this.reflector.get<PolicyHandler[]>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    );

    if (!handlers || handlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user: { sub: string; organizationId: string; orgRole: OrgRole };
      tenantContext?: { role: OrgRole; workspaceRole?: WorkspaceRole };
    }>();
    const { sub, organizationId, orgRole } = request.user;

    const authCtx: AuthContext = {
      userId: sub,
      organizationId,
      orgRole,
      workspaceRole: request.tenantContext?.workspaceRole,
    };

    const ability: AppAbility = this.abilityFactory.createForContext(authCtx);

    const allAllowed = handlers.every((handler) => handler(ability));
    if (!allAllowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
