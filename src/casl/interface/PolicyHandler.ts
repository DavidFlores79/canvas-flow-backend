// ABOUTME: Interface for CASL policy handler functions used with @CheckPolicies decorator
// ABOUTME: Each handler receives an AppAbility and returns true/false

import { AppAbility } from '../factory/AbilityFactory';

export interface PolicyHandler {
  (ability: AppAbility): boolean;
}
