import { Module } from '@nestjs/common';
import { SmsValidationService } from './service/SmsValidationService';
import { ConfigService } from '@nestjs/config';
import {
  SmsValidation,
  SmsValidationSchema,
} from './schemas/SmsValidationSchema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [],
  providers: [SmsValidationService, ConfigService],
  imports: [
    MongooseModule.forFeature([
      { name: SmsValidation.name, schema: SmsValidationSchema },
    ]),
  ],
  exports: [SmsValidationService],
})
export class SmsValidationModule {}
