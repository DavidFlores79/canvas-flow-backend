// scripts/db-migrate.ts
import { AppDataSource } from '../src/database/data-source';

async function migrate() {
  try {
    console.log('Starting database connection...');
    await AppDataSource.initialize();

    console.log('Running migratoions...');
    const result = await AppDataSource.runMigrations();

    console.log('Migrations done...');
    result.forEach(m => console.log(`- ${m.name}`));

    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error executing migrations', err);
    process.exit(1);
  }
}

migrate();
