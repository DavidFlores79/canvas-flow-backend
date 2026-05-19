// ABOUTME: Webhook controller for receiving Cloudinary processing status events
// ABOUTME: Validates webhook signature before processing notification payloads

import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { v2 as cloudinary } from 'cloudinary';

import { CloudinaryWebhookPayloadDto } from '../dto/CloudinaryWebhookPayloadDto';

@ApiTags('Cloudinary')
@Controller('cloudinary')
export class CloudinaryWebhookController {
  private readonly logger = new Logger(CloudinaryWebhookController.name);

  @Post('webhook')
  @ApiOperation({ summary: 'Receive Cloudinary processing status webhook' })
  @ApiResponse({ status: 200, description: 'Webhook received successfully' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  handleWebhook(
    @Body() payload: CloudinaryWebhookPayloadDto,
    @Headers('x-cld-signature') signature: string,
    @Headers('x-cld-timestamp') timestamp: string,
  ): { received: boolean } {
    const isValid = cloudinary.utils.verifyNotificationSignature(
      JSON.stringify(payload),
      parseInt(timestamp, 10),
      signature,
    );

    if (!isValid) {
      this.logger.warn('Invalid Cloudinary webhook signature received');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(
      `Cloudinary webhook received: ${payload.notification_type}`,
    );
    return { received: true };
  }
}
