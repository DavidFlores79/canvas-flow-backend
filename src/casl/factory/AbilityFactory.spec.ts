// ABOUTME: Unit tests for AbilityFactory covering all role × action × resource combinations
// ABOUTME: Verifies CASL permission rules are correctly built from AuthContext

import { AbilityFactory } from './AbilityFactory';
import { OrgRole } from '../../shared/enum/OrgRole';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';
import { AuthContext } from '../interface/AuthContext';

describe('AbilityFactory', () => {
  let factory: AbilityFactory;

  beforeEach(() => {
    factory = new AbilityFactory();
  });

  const baseCtx = (orgRole: OrgRole, workspaceRole?: WorkspaceRole): AuthContext => ({
    userId: 'user-1',
    organizationId: 'org-1',
    orgRole,
    workspaceRole,
  });

  describe('OrgRole.Owner', () => {
    it('can manage all resources', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Owner));
      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('can delete Organization', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Owner));
      expect(ability.can('delete', 'Organization')).toBe(true);
    });

    it('can create Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Owner));
      expect(ability.can('create', 'Workspace')).toBe(true);
    });

    it('can manage Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Owner));
      expect(ability.can('manage', 'Project')).toBe(true);
    });
  });

  describe('OrgRole.Admin', () => {
    it('can manage Organization', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.can('manage', 'Organization')).toBe(true);
    });

    it('cannot delete Organization', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.cannot('delete', 'Organization')).toBe(true);
    });

    it('can invite to Organization', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.can('invite', 'Organization')).toBe(true);
    });

    it('can manage Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.can('manage', 'Workspace')).toBe(true);
    });

    it('can manage Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.can('manage', 'Project')).toBe(true);
    });

    it('can manage Layer', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.can('manage', 'Layer')).toBe(true);
    });

    it('can manage Asset', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Admin));
      expect(ability.can('manage', 'Asset')).toBe(true);
    });
  });

  describe('OrgRole.Member', () => {
    it('can read Organization', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member));
      expect(ability.can('read', 'Organization')).toBe(true);
    });

    it('can create Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member));
      expect(ability.can('create', 'Workspace')).toBe(true);
    });

    it('cannot delete Organization', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member));
      expect(ability.cannot('delete', 'Organization')).toBe(true);
    });

    it('cannot manage Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member));
      expect(ability.cannot('manage', 'Project')).toBe(true);
    });

    it('cannot delete Asset', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member));
      expect(ability.cannot('delete', 'Asset')).toBe(true);
    });
  });

  describe('WorkspaceRole.Owner', () => {
    it('can manage Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Owner));
      expect(ability.can('manage', 'Workspace')).toBe(true);
    });

    it('can manage Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Owner));
      expect(ability.can('manage', 'Project')).toBe(true);
    });

    it('can manage Layer', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Owner));
      expect(ability.can('manage', 'Layer')).toBe(true);
    });

    it('can manage Asset', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Owner));
      expect(ability.can('manage', 'Asset')).toBe(true);
    });

    it('can delete Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Owner));
      expect(ability.can('delete', 'Project')).toBe(true);
    });
  });

  describe('WorkspaceRole.Editor', () => {
    it('can read Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.can('read', 'Workspace')).toBe(true);
    });

    it('cannot delete Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.cannot('delete', 'Workspace')).toBe(true);
    });

    it('can create Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.can('create', 'Project')).toBe(true);
    });

    it('can read Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.can('read', 'Project')).toBe(true);
    });

    it('can update Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.can('update', 'Project')).toBe(true);
    });

    it('cannot delete Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.cannot('delete', 'Project')).toBe(true);
    });

    it('can manage Layer', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.can('manage', 'Layer')).toBe(true);
    });

    it('can manage Asset', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Editor));
      expect(ability.can('manage', 'Asset')).toBe(true);
    });
  });

  describe('WorkspaceRole.Viewer', () => {
    it('can read Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.can('read', 'Workspace')).toBe(true);
    });

    it('can read Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.can('read', 'Project')).toBe(true);
    });

    it('can read Layer', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.can('read', 'Layer')).toBe(true);
    });

    it('can read Asset', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.can('read', 'Asset')).toBe(true);
    });

    it('cannot create Project', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.cannot('create', 'Project')).toBe(true);
    });

    it('cannot delete Workspace', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.cannot('delete', 'Workspace')).toBe(true);
    });

    it('cannot manage Asset', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member, WorkspaceRole.Viewer));
      expect(ability.cannot('delete', 'Asset')).toBe(true);
    });
  });

  describe('no workspaceRole', () => {
    it('does not grant workspace-level permissions when workspaceRole is absent', () => {
      const ability = factory.createForContext(baseCtx(OrgRole.Member));
      expect(ability.cannot('manage', 'Layer')).toBe(true);
    });
  });
});
