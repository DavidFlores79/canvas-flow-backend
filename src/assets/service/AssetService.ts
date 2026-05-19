// ABOUTME: Service for Asset CRUD operations scoped to an organization
// ABOUTME: Handles business logic for managing uploaded media assets from Cloudinary

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Asset, AssetDocument } from '../schemas/AssetSchema';
import { CreateAssetPayloadDto } from '../dto/CreateAssetPayloadDto';
import { FilterAssetsQueryDto } from '../dto/FilterAssetsQueryDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
  ) {}

  async create(dto: CreateAssetPayloadDto, organizationId: string): Promise<Asset> {
    this.logger.log(`Creating asset "${dto.cloudinaryPublicId}" in org: ${organizationId}`);

    const asset = new this.assetModel({
      ...dto,
      organizationId: new Types.ObjectId(organizationId),
      workspaceId: new Types.ObjectId(dto.workspaceId),
    });

    const saved = await asset.save();
    this.logger.log(`Asset created successfully: ${saved.id}`);
    return saved;
  }

  async findAll(organizationId: string, query: FilterAssetsQueryDto): Promise<Asset[]> {
    this.logger.debug(`Finding assets in org: ${organizationId}`);

    const filter: Record<string, unknown> = {
      organizationId: new Types.ObjectId(organizationId),
    };

    if (query.workspaceId) {
      filter.workspaceId = new Types.ObjectId(query.workspaceId);
    }

    return this.assetModel.find(filter).exec();
  }

  async findById(id: string): Promise<Asset> {
    this.logger.debug(`Finding asset by id: ${id}`);
    const asset = await this.assetModel.findById(id).exec();

    if (!asset) {
      this.logger.warn(`Asset not found: ${id}`);
      throw new NotFoundEntityError('Asset not found', 'Asset', '404');
    }

    return asset;
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting asset: ${id}`);
    const result = await this.assetModel.findByIdAndDelete(id).exec();

    if (!result) {
      this.logger.warn(`Asset not found for deletion: ${id}`);
      throw new NotFoundEntityError('Asset not found', 'Asset', '404');
    }

    this.logger.log(`Asset deleted successfully: ${id}`);
  }
}
