// ABOUTME: NestJS module for AI image generation orchestration
// ABOUTME: Wires LeonardoService, CloudinaryService, and AssetService into AiService

import { Module } from '@nestjs/common';

import { AiService } from './service/AiService';
import { AiController } from './controller/AiController';
import { LeonardoModule } from '../leonardo/LeonardoModule';
import { CloudinaryModule } from '../cloudinary/CloudinaryModule';
import { AssetsModule } from '../assets/AssetsModule';
import { CaslModule } from '../casl/CaslModule';

@Module({
  imports: [LeonardoModule, CloudinaryModule, AssetsModule, CaslModule],
  providers: [AiService],
  controllers: [AiController],
})
export class AiModule {}
