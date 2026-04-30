import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SmsValidationDocument = HydratedDocument<SmsValidation>;

@Schema({ timestamps: true, collection: 'sms_validations' })
export class SmsValidation {
  id: string;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String })
  smsProvider?: string;

  @Prop({ type: String, index: true })
  phone?: string;

  @Prop({ type: String, index: true })
  status?: string;

  @Prop({ type: String, index: true })
  smsServiceSid?: string;

  @Prop({ type: String, index: true })
  smsRequestSid?: string;

  @Prop({ type: String })
  smsAction?: string;

  @Prop({ type: String })
  smsStatus?: string;

  @Prop({ type: Date })
  smsRequestDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const SmsValidationSchema = SchemaFactory.createForClass(SmsValidation);

SmsValidationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: Record<string, any>) => {
    if (ret._id) {
      ret.id = (ret._id as { toString(): string }).toString();
    }
    delete ret._id;
    delete ret.__v;
  },
});
SmsValidationSchema.set('toObject', { virtuals: true });

export { SmsValidationSchema };
