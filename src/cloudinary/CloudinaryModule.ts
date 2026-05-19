// ABOUTME: NestJS module for Cloudinary media service integration
// ABOUTME: Provides CloudinaryService for upload/delete/transform operations

import { Module } from '@nestjs/common';

import { CloudinaryService } from './service/CloudinaryService';
import { CloudinaryWebhookController } from './controller/CloudinaryWebhookController';

@Module({
  controllers: [CloudinaryWebhookController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
