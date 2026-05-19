// ABOUTME: Mongoose schema for Project documents (individual canvases)
// ABOUTME: Supports optimistic locking via version field for concurrent edits

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'projects' })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: Number, default: 800 })
  width: number;

  @Prop({ type: Number, default: 600 })
  height: number;

  @Prop({ type: Number, default: 0 })
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
