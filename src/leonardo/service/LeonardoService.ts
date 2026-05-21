// ABOUTME: Service for triggering and polling Leonardo AI image generation jobs
// ABOUTME: Generated images are downloaded and synced to Cloudinary as source of truth

import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../../config/EnvironmentVariables';

const DEFAULT_LEONARDO_BASE_URL = 'https://cloud.leonardo.ai/api/rest/v1';

export interface LeonardoGenerationImage {
  url: string;
  id: string;
}

export interface LeonardoGenerationResult {
  status: string;
  images: LeonardoGenerationImage[];
}

export interface LeonardoCreateGenerationOptions {
  width?: number;
  height?: number;
  numImages?: number;
  presetStyle?: string;
}

@Injectable()
export class LeonardoService {
  private readonly logger = new Logger(LeonardoService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    this.apiKey = this.configService.get('LEONARDO_API_KEY', { infer: true }) ?? '';
    this.baseUrl =
      this.configService.get('LEONARDO_API_BASE_URL', { infer: true }) ??
      DEFAULT_LEONARDO_BASE_URL;
  }

  async createGeneration(
    prompt: string,
    modelId: string,
    options: LeonardoCreateGenerationOptions = {},
  ): Promise<{ generationId: string }> {
    this.logger.log(`Creating Leonardo generation with model: ${modelId}`);

    const body: Record<string, unknown> = {
      prompt,
      modelId,
    };

    if (options.width !== undefined) body.width = options.width;
    if (options.height !== undefined) body.height = options.height;
    if (options.numImages !== undefined) body.num_images = options.numImages;
    if (options.presetStyle !== undefined) body.presetStyle = options.presetStyle;

    const response = await fetch(`${this.baseUrl}/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      this.logger.error(`Leonardo API error on create: ${errorData}`);
      throw new UnprocessableEntityException(errorData);
    }

    const data = (await response.json()) as { sdGenerationJob?: { generationId: string }; generationId?: string };
    const generationId =
      data?.sdGenerationJob?.generationId ?? (data?.generationId as string);

    this.logger.log(`Leonardo generation created: ${generationId}`);
    return { generationId };
  }

  async getGeneration(generationId: string): Promise<LeonardoGenerationResult> {
    this.logger.debug(`Fetching Leonardo generation: ${generationId}`);

    const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      this.logger.error(`Leonardo API error on get: ${errorData}`);
      throw new UnprocessableEntityException(errorData);
    }

    const data = (await response.json()) as {
      generations_by_pk?: {
        status: string;
        generated_images: Array<{ url: string; id: string }>;
      };
    };

    const generation = data?.generations_by_pk;
    return {
      status: generation?.status ?? 'UNKNOWN',
      images: (generation?.generated_images ?? []).map((img) => ({
        url: img.url,
        id: img.id,
      })),
    };
  }

  async deleteGeneration(generationId: string): Promise<void> {
    this.logger.log(`Deleting Leonardo generation: ${generationId}`);

    const response = await fetch(`${this.baseUrl}/generations/${generationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      this.logger.error(`Leonardo API error on delete: ${errorData}`);
      throw new UnprocessableEntityException(errorData);
    }

    this.logger.log(`Leonardo generation deleted: ${generationId}`);
  }

  private async parseErrorResponse(response: Response): Promise<string> {
    try {
      const errorBody = (await response.json()) as { error?: string; message?: string };
      return errorBody?.error ?? errorBody?.message ?? `HTTP ${response.status}`;
    } catch {
      return `HTTP ${response.status}`;
    }
  }
}
