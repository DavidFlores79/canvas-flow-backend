// ABOUTME: Decorator to attach CASL policy handlers to controller methods
// ABOUTME: Used with PoliciesGuard to enforce authorization at the route level

import { SetMetadata } from '@nestjs/common';
import { PolicyHandler } from '../interface/PolicyHandler';

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
