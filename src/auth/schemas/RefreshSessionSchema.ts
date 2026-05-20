// ABOUTME: Mongoose schema for persisted refresh-token sessions and rotation tracking
// ABOUTME: Stores hashed refresh token metadata to support revocation and replay detection

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { OrgRole } from '../../shared/enum/OrgRole';

export type RefreshSessionDocument = HydratedDocument<RefreshSession>;

@Schema({ timestamps: true, collection: 'refresh_sessions' })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  jti: string;

  @Prop({ type: String, required: true, index: true })
  familyId: string;

  @Prop({ type: String, required: true })
  tokenHash: string;

  @Prop({ type: String, required: false, index: true })
  audience?: string;

  @Prop({ type: Types.ObjectId, required: false, index: true })
  organizationId?: Types.ObjectId;

  @Prop({ type: String, required: false })
  orgRole?: OrgRole;

  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;

  @Prop({ type: Date, required: false, index: true })
  revokedAt?: Date;

  @Prop({ type: String, required: false })
  revokeReason?: string;

  @Prop({ type: String, required: false, index: true })
  replacedByJti?: string;

  @Prop({ type: Date, required: false })
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const RefreshSessionSchema =
  SchemaFactory.createForClass(RefreshSession);
