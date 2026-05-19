// ABOUTME: Orchestration service for AI image generation via Leonardo + Cloudinary + Asset persistence
// ABOUTME: Polls Leonardo synchronously (max 60s), downloads results, uploads to Cloudinary, saves Assets

import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';

import { LeonardoService } from '../../leonardo/service/LeonardoService';
import { CloudinaryService } from '../../cloudinary/service/CloudinaryService';
import { AssetService } from '../../assets/service/AssetService';
import { AiGeneratePayloadDto } from '../dto/AiGeneratePayloadDto';
import { Asset } from '../../assets/schemas/AssetSchema';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20; // 20 × 3s = 60s

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly leonardoService: LeonardoService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly assetService: AssetService,
  ) {}

  async generate(dto: AiGeneratePayloadDto, organizationId: string): Promise<Asset[]> {
    this.logger.log(`Starting AI generation for org: ${organizationId}, prompt: "${dto.prompt}"`);

    const { generationId } = await this.leonardoService.createGeneration(
      dto.prompt,
      dto.modelId,
      { width: dto.width, height: dto.height, numImages: dto.numImages },
    );

    this.logger.debug(`Leonardo generation created: ${generationId}`);

    const result = await this.pollUntilComplete(generationId);

    this.logger.log(`Generation complete, downloading ${result.images.length} image(s)`);

    const assets: Asset[] = [];
    for (const img of result.images) {
      const asset = await this.downloadAndSave(img.url, img.id, generationId, dto, organizationId);
      assets.push(asset);
    }

    return assets;
  }

  private async pollUntilComplete(generationId: string) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL_MS));

      const poll = await this.leonardoService.getGeneration(generationId);
      this.logger.debug(`Poll attempt ${attempt + 1}: status=${poll.status}`);

      if (poll.status === 'COMPLETE') return poll;
      if (poll.status === 'FAILED') {
        throw new UnprocessableEntityException('Leonardo generation failed');
      }
    }

    throw new UnprocessableEntityException('AI generation timed out after 60 seconds');
  }

  private async downloadAndSave(
    imageUrl: string,
    leonardoImageId: string,
    generationId: string,
    dto: AiGeneratePayloadDto,
    organizationId: string,
  ): Promise<Asset> {
    this.logger.debug(`Downloading generated image: ${leonardoImageId}`);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new UnprocessableEntityException(
        `Failed to download generated image: ${response.status}`,
      );
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const uploaded = await this.cloudinaryService.uploadFile(
      { buffer, originalname: `ai_${leonardoImageId}.jpg`, mimetype: 'image/jpeg' },
      `canvas-flow/${organizationId}/ai-generated`,
    );

    return this.assetService.create(
      {
        workspaceId: dto.workspaceId,
        cloudinaryPublicId: uploaded.publicId,
        url: uploaded.url,
        type: 'image',
        metadata: {
          generationId,
          leonardoImageId,
          prompt: dto.prompt,
        },
      },
      organizationId,
    );
  }
}
