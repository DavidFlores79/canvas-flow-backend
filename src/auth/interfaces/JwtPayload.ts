// ABOUTME: JWT payload interface for Canvas Flow tokens
// ABOUTME: Carries userId, active organizationId, and org-level role

import { OrgRole } from '../../shared/enum/OrgRole';

export interface JwtPayload {
  sub: string; // userId (MongoDB ObjectId as string)
  organizationId?: string; // active org ObjectId
  orgRole?: OrgRole; // owner | admin | member
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  fid?: string;
}
