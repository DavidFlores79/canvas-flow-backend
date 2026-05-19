// ABOUTME: Mongoose schema for WorkspaceMember documents
// ABOUTME: Tracks workspace membership with role for access control

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { WorkspaceRole } from '../../shared/enum/WorkspaceRole';

export type WorkspaceMemberDocument = HydratedDocument<WorkspaceMember>;

@Schema({ timestamps: true, collection: 'workspace_members' })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(WorkspaceRole) })
  role: WorkspaceRole;
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMemberSchema.index({ userId: 1, role: 1 });
