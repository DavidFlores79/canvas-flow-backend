// ABOUTME: Enum defining organization-level roles for CASL authorization
// ABOUTME: Used in JWT payload, OrganizationMember schema, and AbilityFactory

export enum OrgRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member',
}
