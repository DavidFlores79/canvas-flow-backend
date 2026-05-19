import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './AppModule';
import { name, version, description } from '../package.json';
import { EnvironmentVariables } from './config/EnvironmentVariables';
import { HttpExceptionFilter } from './interceptors/HttpExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(
    ConfigService<EnvironmentVariables>,
  );
  const isNotProduction =
    configService.get('DEPLOY_ENV', { infer: true }) !== 'production';

  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new HttpExceptionFilter());

  if (isNotProduction) {
    const config = new DocumentBuilder()
      .setTitle(name)
      .setDescription(description)
      .setVersion(version)
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  // Extend HTTP server timeout to 90s to accommodate AI generation polling (up to 60s)
  app.getHttpServer().setTimeout(90_000);
}

bootstrap()
  .then()
  .catch((error) => console.error(error));
