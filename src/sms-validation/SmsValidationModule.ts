import { Module } from '@nestjs/common';
import { SmsValidationService } from './service/SmsValidationService';
import { ConfigService } from '@nestjs/config';
import { SmsValidation } from './entity/SmsValidation';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [],
  providers: [SmsValidationService, ConfigService],
  imports: [TypeOrmModule.forFeature([SmsValidation])],
  exports: [SmsValidationService],
})
export class SmsValidationModule {}
