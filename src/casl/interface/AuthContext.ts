// ABOUTME: Auth context interface passed to AbilityFactory for CASL rule building
// ABOUTME: Derived from JWT payload and optional workspace membership

import { OrgRole } from '../../shared/enum/OrgRole';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';

export interface AuthContext {
  userId: string;
  organizationId: string;
  orgRole: OrgRole;
  workspaceRole?: WorkspaceRole;
}
