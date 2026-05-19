// ABOUTME: NestJS module bundling Layer schema, service, and controller
// ABOUTME: Imports CaslModule for authorization guards; exports LayerService for cross-module use

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Layer, LayerSchema } from './schemas/LayerSchema';
import { LayerService } from './service/LayerService';
import { LayerController } from './controller/LayerController';
import { CaslModule } from '../casl/CaslModule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Layer.name, schema: LayerSchema },
    ]),
    CaslModule,
  ],
  providers: [LayerService],
  controllers: [LayerController],
  exports: [LayerService],
})
export class LayersModule {}
