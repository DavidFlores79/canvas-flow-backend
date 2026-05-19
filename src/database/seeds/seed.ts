// ABOUTME: CLI entry point for running database seeds
// ABOUTME: Creates NestJS application context, runs seeds, then closes

import { NestFactory } from '@nestjs/core';

import { SeederModule } from './SeederModule';
import { SeederService } from './SeederService';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(SeederService);
  await seeder.seed();
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
