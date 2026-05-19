// ABOUTME: Mongoose schema for Asset documents (uploaded media files)
// ABOUTME: Cloudinary is source of truth; stores public ID, URL, type, and metadata

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AssetDocument = HydratedDocument<Asset>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'assets' })
export class Asset {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: String, required: true })
  cloudinaryPublicId: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: true, enum: ['image', 'video', 'document'] })
  type: string;

  @Prop({ type: Map, of: Object })
  metadata: Map<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
