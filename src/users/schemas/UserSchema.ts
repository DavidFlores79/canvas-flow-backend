import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Address, AddressSchema } from './AddressSchema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  id: string;

  @Prop({ type: String, trim: true })
  firstName?: string;

  @Prop({ type: String, trim: true })
  middleName?: string;

  @Prop({ type: String, trim: true })
  lastName?: string;

  @Prop({ type: String, trim: true })
  secondLastName?: string;

  @Prop({ type: String, trim: true })
  fullName?: string;

  @Prop({ type: String, trim: true })
  displayName?: string;

  @Prop({ type: String, trim: true })
  email?: string;

  @Prop({ type: String, required: true, unique: true, index: true, trim: true })
  phone: string;

  @Prop({ type: String })
  password?: string;

  @Prop({ type: String, trim: true })
  gender?: string;

  @Prop({ type: String, required: true })
  group: string;

  @Prop({ type: String, unique: true, sparse: true, index: true, trim: true })
  rfc?: string;

  @Prop({ type: String, unique: true, sparse: true, index: true, trim: true })
  curp?: string;

  @Prop({ type: Date })
  birthDate?: Date;

  @Prop({ type: String, trim: true })
  nationality?: string;

  @Prop({ type: String, trim: true })
  countryOfBirth?: string;

  @Prop({ type: String, trim: true })
  stateOfBirth?: string;

  @Prop({ type: String, trim: true })
  riskLevel?: string;

  @Prop({ type: Boolean, default: false })
  profileCompleted: boolean;

  @Prop({ type: String, required: true, index: true })
  status: string;

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];

  @Prop({ type: Boolean, default: false })
  verified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    if (ret._id) {
      ret.id = (ret._id as { toString(): string }).toString();
    }
    delete ret._id;
    delete ret.__v;
  },
});
UserSchema.set('toObject', { virtuals: true });

export { UserSchema };
