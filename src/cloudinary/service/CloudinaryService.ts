// ABOUTME: Service for Cloudinary media operations (upload, delete, transform)
// ABOUTME: Cloudinary is the source of truth for all media assets in the platform

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { EnvironmentVariables } from '../../config/EnvironmentVariables';

export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size?: number;
  fieldname?: string;
  encoding?: string;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  resourceType: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      api_key: this.configService.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET', { infer: true }),
    });
  }

  uploadFile(
    file: MulterFile,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload error: ${error.message}`);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('No result returned from Cloudinary upload'));
          }
          this.logger.log(`File uploaded to Cloudinary: ${result.public_id}`);
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            resourceType: result.resource_type,
          });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    this.logger.log(`Deleting file from Cloudinary: ${publicId}`);
    await cloudinary.uploader.destroy(publicId);
    this.logger.log(`File deleted from Cloudinary: ${publicId}`);
  }

  getTransformUrl(publicId: string, transformOptions: object): string {
    return cloudinary.url(publicId, { ...transformOptions, secure: true });
  }

  async eagerTransformUrl(publicId: string, transformOptions: object): Promise<string> {
    this.logger.log(`Eager-generating transform for: ${publicId}`);
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      eager: [transformOptions],
      eager_async: false,
    });
    const eager = result?.eager?.[0];
    if (!eager?.secure_url) {
      throw new Error('Cloudinary eager transform returned no URL');
    }
    this.logger.log(`Eager transform ready: ${eager.secure_url}`);
    return eager.secure_url;
  }
}
