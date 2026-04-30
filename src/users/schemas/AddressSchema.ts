import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type AddressDocument = mongoose.HydratedDocument<Address>;

@Schema({
  _id: false,
  timestamps: false,
})
export class Address {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  street: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  externalNumber: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  internalNumber?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  suburb?: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  county?: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  city: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  state: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  zipCode: string;

  @Prop({
    type: String,
    required: false,
    trim: true,
  })
  country: string;
}

const AddressSchema = SchemaFactory.createForClass(Address);

export { AddressSchema };
