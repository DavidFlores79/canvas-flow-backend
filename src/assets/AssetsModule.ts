// ABOUTME: NestJS module bundling Asset schema, service, and controller
// ABOUTME: Imports CaslModule for authorization guards; exports AssetService for cross-module use

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Asset, AssetSchema } from './schemas/AssetSchema';
import { AssetService } from './service/AssetService';
import { AssetController } from './controller/AssetController';
import { CaslModule } from '../casl/CaslModule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
    ]),
    CaslModule,
  ],
  providers: [AssetService],
  controllers: [AssetController],
  exports: [AssetService],
})
export class AssetsModule {}
