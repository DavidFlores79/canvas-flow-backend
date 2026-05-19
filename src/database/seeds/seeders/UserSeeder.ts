// ABOUTME: Seeds initial user accounts for Paisamex and Luxfree organizations
// ABOUTME: Idempotent — checks by email before inserting, skips if already exists

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../../../users/schemas/UserSchema';

export interface SeedUserResult {
  paisamexUser: UserDocument;
  luxfreeUser: UserDocument;
}

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async seed(): Promise<SeedUserResult> {
    const paisamexUser = await this.seedUser({
      email: 'david.flores@paisamex.mx',
      firstName: 'David',
      lastName: 'Flores',
      phone: '+521234560001',
      password: 'Admin123!',
      status: 'validated',
      verified: true,
      group: 'client_user',
    });

    const luxfreeUser = await this.seedUser({
      email: 'admin@luxfree.mx',
      firstName: 'Admin',
      lastName: 'Luxfree',
      phone: '+521234560002',
      password: 'Admin123!',
      status: 'validated',
      verified: true,
      group: 'client_user',
    });

    return { paisamexUser, luxfreeUser };
  }

  private async seedUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    status: string;
    verified: boolean;
    group: string;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: data.email }).exec();

    if (existing) {
      this.logger.log(`User already exists, skipping: ${data.email}`);
      return existing;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new this.userModel({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      password: hashedPassword,
      status: data.status,
      verified: data.verified,
      group: data.group,
    });

    const saved = await user.save();
    this.logger.log(`Created user: ${data.email}`);
    return saved;
  }
}
