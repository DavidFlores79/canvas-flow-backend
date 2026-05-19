// ABOUTME: Mongoose schema for Layer documents within a canvas project
// ABOUTME: Supports text, image, and shape layer types with flexible properties map

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LayerDocument = HydratedDocument<Layer>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'layers' })
export class Layer {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Asset' })
  assetId?: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['text', 'image', 'shape'] })
  type: string;

  @Prop({ type: Map, of: Object })
  properties: Map<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export const LayerSchema = SchemaFactory.createForClass(Layer);
