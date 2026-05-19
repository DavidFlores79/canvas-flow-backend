// ABOUTME: Service for Asset CRUD operations scoped to an organization
// ABOUTME: Handles business logic for managing uploaded media assets from Cloudinary

import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Asset, AssetDocument } from '../schemas/AssetSchema';
import { CreateAssetPayloadDto } from '../dto/CreateAssetPayloadDto';
import { FilterAssetsQueryDto } from '../dto/FilterAssetsQueryDto';
import { UploadAssetPayloadDto } from '../dto/UploadAssetPayloadDto';
import { TransformAssetPayloadDto } from '../dto/TransformAssetPayloadDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { CloudinaryService } from '../../cloudinary/service/CloudinaryService';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
    private readonly cloudinaryService: CloudinaryService,
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

  async upload(
    file: Express.Multer.File,
    dto: UploadAssetPayloadDto,
    organizationId: string,
  ): Promise<Asset> {
    this.logger.log(`Uploading file "${file.originalname}" for org: ${organizationId}`);

    const uploaded = await this.cloudinaryService.uploadFile(
      file,
      `canvas-flow/${organizationId}`,
    );

    return this.create(
      {
        workspaceId: dto.workspaceId,
        cloudinaryPublicId: uploaded.publicId,
        url: uploaded.url,
        type: dto.type ?? uploaded.resourceType ?? 'image',
      },
      organizationId,
    );
  }

  async transform(
    id: string,
    dto: TransformAssetPayloadDto,
    organizationId: string,
  ): Promise<Asset> {
    this.logger.log(`Transforming asset: ${id}`);

    const original = await this.findById(id);
    const transformOptions = this.buildTransformOptions(dto);
    const derivedUrl = this.cloudinaryService.getTransformUrl(
      original.cloudinaryPublicId,
      transformOptions,
    );

    this.logger.debug(`Fetching derived URL: ${derivedUrl}`);
    const response = await fetch(derivedUrl);
    if (!response.ok) {
      this.logger.error(`Cloudinary transform fetch failed: ${response.status}`);
      throw new UnprocessableEntityException('Cloudinary transform failed');
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const ext = dto.format ?? 'png';
    const uploaded = await this.cloudinaryService.uploadFile(
      { buffer, originalname: `transformed_${Date.now()}.${ext}`, mimetype: `image/${ext}` },
      `canvas-flow/${organizationId}/transforms`,
    );

    return this.create(
      {
        workspaceId: dto.workspaceId,
        cloudinaryPublicId: uploaded.publicId,
        url: uploaded.url,
        type: 'image',
        metadata: {
          sourceAssetId: id,
          transformations: dto as unknown as Record<string, unknown>,
        },
      },
      organizationId,
    );
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

  private buildTransformOptions(dto: TransformAssetPayloadDto): object {
    const effects: string[] = [];
    if (dto.removeBackground) effects.push('e_background_removal');
    if (dto.grayscale) effects.push('e_grayscale');
    if (dto.brightness !== undefined) effects.push(`e_brightness:${dto.brightness}`);
    if (dto.contrast !== undefined) effects.push(`e_contrast:${dto.contrast}`);
    if (dto.blur !== undefined) effects.push(`e_blur:${dto.blur}`);

    return {
      ...(dto.width && { width: dto.width }),
      ...(dto.height && { height: dto.height }),
      ...(dto.crop && { crop: dto.crop }),
      ...(dto.format && { fetch_format: dto.format }),
      ...(effects.length && { effect: effects.join(',') }),
      quality: 'auto',
    };
  }
}
