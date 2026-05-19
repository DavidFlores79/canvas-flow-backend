// ABOUTME: CASL AbilityFactory that builds permission rules from AuthContext (no DB queries)
// ABOUTME: Rules are computed from in-memory JWT data only for performance

import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
} from '@casl/ability';

import { OrgRole } from '../../shared/enum/OrgRole';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';
import { AuthContext } from '../interface/AuthContext';

type Subjects = InferSubjects<'Organization' | 'Workspace' | 'Project' | 'Layer' | 'Asset' | 'all'>;
type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'invite';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForContext(ctx: AuthContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (ctx.orgRole === OrgRole.Owner) {
      can('manage', 'all');
    }

    if (ctx.orgRole === OrgRole.Admin) {
      can('manage', 'Organization');
      can('manage', 'Workspace');
      can('manage', 'Project');
      can('manage', 'Layer');
      can('manage', 'Asset');
      can('invite', 'Organization');
      cannot('delete', 'Organization');
    }

    if (ctx.orgRole === OrgRole.Member) {
      can('read', 'Organization');
      can('create', 'Workspace');
    }

    if (ctx.workspaceRole === WorkspaceRole.Owner) {
      can('manage', 'Workspace');
      can('manage', 'Project');
      can('manage', 'Layer');
      can('manage', 'Asset');
    }

    if (ctx.workspaceRole === WorkspaceRole.Editor) {
      can('read', 'Workspace');
      can(['create', 'read', 'update'], 'Project');
      can('manage', 'Layer');
      can('manage', 'Asset');
      cannot('delete', 'Workspace');
      cannot('delete', 'Project');
    }

    if (ctx.workspaceRole === WorkspaceRole.Viewer) {
      can('read', 'Workspace');
      can('read', 'Project');
      can('read', 'Layer');
      can('read', 'Asset');
    }

    return build();
  }
}
