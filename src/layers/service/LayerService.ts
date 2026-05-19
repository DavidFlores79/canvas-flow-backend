// ABOUTME: Service for Layer CRUD and bulk-update operations within canvas projects
// ABOUTME: Handles business logic for managing individual layer elements on a canvas

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Layer, LayerDocument } from '../schemas/LayerSchema';
import { CreateLayerPayloadDto } from '../dto/CreateLayerPayloadDto';
import { UpdateLayerPayloadDto } from '../dto/UpdateLayerPayloadDto';
import { BulkUpdateLayersPayloadDto } from '../dto/BulkUpdateLayersPayloadDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';

@Injectable()
export class LayerService {
  private readonly logger = new Logger(LayerService.name);

  constructor(
    @InjectModel(Layer.name)
    private readonly layerModel: Model<LayerDocument>,
  ) {}

  async create(
    dto: CreateLayerPayloadDto,
    projectId: string,
    organizationId: string,
  ): Promise<Layer> {
    this.logger.log(`Creating layer of type "${dto.type}" in project: ${projectId}`);

    const layer = new this.layerModel({
      ...dto,
      projectId: new Types.ObjectId(projectId),
      organizationId: new Types.ObjectId(organizationId),
      ...(dto.assetId ? { assetId: new Types.ObjectId(dto.assetId) } : {}),
    });

    const saved = await layer.save();
    this.logger.log(`Layer created successfully: ${saved.id}`);
    return saved;
  }

  async findAll(projectId: string): Promise<Layer[]> {
    this.logger.debug(`Finding layers for project: ${projectId}`);

    return this.layerModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .exec();
  }

  async findById(id: string): Promise<Layer> {
    this.logger.debug(`Finding layer by id: ${id}`);
    const layer = await this.layerModel.findById(id).exec();

    if (!layer) {
      this.logger.warn(`Layer not found: ${id}`);
      throw new NotFoundEntityError('Layer not found', 'Layer', '404');
    }

    return layer;
  }

  async update(id: string, dto: UpdateLayerPayloadDto): Promise<Layer> {
    this.logger.log(`Updating layer: ${id}`);

    const layer = await this.layerModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!layer) {
      this.logger.warn(`Layer not found for update: ${id}`);
      throw new NotFoundEntityError('Layer not found', 'Layer', '404');
    }

    this.logger.log(`Layer updated successfully: ${id}`);
    return layer;
  }

  async bulkUpdate(projectId: string, dto: BulkUpdateLayersPayloadDto): Promise<Layer[]> {
    this.logger.log(`Bulk updating ${dto.layers.length} layers in project: ${projectId}`);

    const updated = await Promise.all(
      dto.layers.map(async (item) => {
        const layer = await this.layerModel
          .findOneAndUpdate(
            {
              _id: new Types.ObjectId(item.id),
              projectId: new Types.ObjectId(projectId),
            },
            { $set: { properties: item.properties } },
            { new: true },
          )
          .exec();

        if (!layer) {
          throw new NotFoundEntityError(
            `Layer not found: ${item.id}`,
            'Layer',
            '404',
          );
        }

        return layer;
      }),
    );

    this.logger.log(`Bulk update completed for project: ${projectId}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting layer: ${id}`);
    const result = await this.layerModel.findByIdAndDelete(id).exec();

    if (!result) {
      this.logger.warn(`Layer not found for deletion: ${id}`);
      throw new NotFoundEntityError('Layer not found', 'Layer', '404');
    }

    this.logger.log(`Layer deleted successfully: ${id}`);
  }
}
