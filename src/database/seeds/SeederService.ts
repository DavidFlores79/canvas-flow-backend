// ABOUTME: Orchestrates all seeders in correct dependency order
// ABOUTME: Called from seed.ts CLI entry point — users first, then orgs, then workspaces

import { Injectable, Logger } from '@nestjs/common';

import { UserSeeder } from './seeders/UserSeeder';
import { OrganizationSeeder } from './seeders/OrganizationSeeder';
import { WorkspaceSeeder } from './seeders/WorkspaceSeeder';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly userSeeder: UserSeeder,
    private readonly organizationSeeder: OrganizationSeeder,
    private readonly workspaceSeeder: WorkspaceSeeder,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting database seed...');

    const users = await this.userSeeder.seed();
    this.logger.log('Users seeded');

    const orgs = await this.organizationSeeder.seed(users);
    this.logger.log('Organizations seeded');

    await this.workspaceSeeder.seed(users, orgs);
    this.logger.log('Workspaces seeded');

    this.logger.log('Database seed complete');
  }
}
