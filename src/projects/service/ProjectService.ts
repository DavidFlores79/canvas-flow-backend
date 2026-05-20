// ABOUTME: Service for Project CRUD operations with optimistic locking support
// ABOUTME: Handles business logic for canvas projects within a tenant workspace

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Project, ProjectDocument } from '../schemas/ProjectSchema';
import { CreateProjectPayloadDto } from '../dto/CreateProjectPayloadDto';
import { UpdateProjectPayloadDto } from '../dto/UpdateProjectPayloadDto';
import { FilterProjectsQueryDto } from '../dto/FilterProjectsQueryDto';
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { LayerService } from '../../layers/service/LayerService';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly layerService: LayerService,
  ) {}

  async create(
    dto: CreateProjectPayloadDto,
    organizationId: string,
    ownerId: string,
  ): Promise<Project> {
    this.logger.log(`Creating project "${dto.name}" in workspace: ${dto.workspaceId}`);

    const project = new this.projectModel({
      ...dto,
      organizationId: new Types.ObjectId(organizationId),
      workspaceId: new Types.ObjectId(dto.workspaceId),
      ownerId: new Types.ObjectId(ownerId),
    });

    const saved = await project.save();
    this.logger.log(`Project created successfully: ${saved.id}`);
    return saved;
  }

  async findAll(query: FilterProjectsQueryDto): Promise<Project[]> {
    this.logger.debug(`Finding projects in workspace: ${query.workspaceId}`);

    return this.projectModel
      .find({ workspaceId: new Types.ObjectId(query.workspaceId) })
      .exec();
  }

  async findById(id: string): Promise<Project> {
    this.logger.debug(`Finding project by id: ${id}`);
    const project = await this.projectModel.findById(id).exec();

    if (!project) {
      this.logger.warn(`Project not found: ${id}`);
      throw new NotFoundEntityError('Project not found', 'Project', '404');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectPayloadDto): Promise<Project> {
    this.logger.log(`Updating project: ${id}`);

    const current = await this.projectModel.findById(id).exec();

    if (!current) {
      this.logger.warn(`Project not found for update: ${id}`);
      throw new NotFoundEntityError('Project not found', 'Project', '404');
    }

    if (current.version !== dto.version) {
      this.logger.warn(`Optimistic locking conflict on project: ${id}`);
      throw new OutdatedEntityVersionError(
        'Project version conflict — please reload and try again',
        'Project',
        '409',
      );
    }

    const { version: _version, ...updateFields } = dto;
    const updated = await this.projectModel
      .findByIdAndUpdate(
        id,
        { $set: updateFields, $inc: { version: 1 } },
        { new: true },
      )
      .exec();

    this.logger.log(`Project updated successfully: ${id}`);
    return updated as Project;
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting project: ${id}`);
    const result = await this.projectModel.findByIdAndDelete(id).exec();

    if (!result) {
      this.logger.warn(`Project not found for deletion: ${id}`);
      throw new NotFoundEntityError('Project not found', 'Project', '404');
    }

    await this.layerService.deleteByProjectId(id);
    this.logger.log(`Project and associated layers deleted: ${id}`);
  }
}
