import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.DEPLOY_ENV;
dotenv.config({
  path: path.resolve(__dirname, `../../environment/${env}.env`),
});

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/src/**/entity/*.js'],
  migrations: ['dist/src/database/migrations/*.js'],
  synchronize: false,
  logging: true,
});
