// ABOUTME: NestJS module for Leonardo AI image generation integration
// ABOUTME: Provides LeonardoService for triggering and polling generation jobs

import { Module } from '@nestjs/common';

import { LeonardoService } from './service/LeonardoService';

@Module({
  providers: [LeonardoService],
  exports: [LeonardoService],
})
export class LeonardoModule {}
