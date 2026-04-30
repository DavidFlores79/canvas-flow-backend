import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
import { UpdateUserPayloadDto } from '../dto/UpdateUserPayloadDto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User, UserDocument } from '../schemas/UserSchema';
import { FilterUsersQueryDto } from '../dto/FilterUsersQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/EnvironmentVariables';
import { Status } from '../enum/UserEnum';
import * as bcrypt from 'bcrypt';

type ValidateUniqueOptions = {
  excludeId?: string;
  group?: string;
  emailStatusFilter?: boolean;
  statusAllowed?: Status[];
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: mongoose.Model<UserDocument>,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async create(payload: CreateUserPayloadDto): Promise<UserDocument> {
    this.logger.log(`Creating user with phone: ${payload.phone}`);
    const fullName = this.generateFullName(payload);

    if (payload.password) {
      payload.password = bcrypt.hashSync(
        payload.password,
        parseInt(this.configService.get('SALT_ROUND', '', { infer: true })),
      );
    }

    if ((payload.status as Status) !== Status.DUPLICATE) {
      await this.validateUniqueFields(payload);
    }

    const createdUser = new this.userModel({
      ...payload,
      fullName,
    });
    const savedUser = await createdUser.save();
    this.logger.log(`User created successfully with id: ${savedUser.id}`);
    return savedUser;
  }

  async findAll(
    filterUsersQueryDto: FilterUsersQueryDto,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, ...filters } = filterUsersQueryDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [items, totalItems] = await Promise.all([
      this.userModel
        .find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(where).exec(),
    ]);

    const pagination: PaginatedResult<User> = {
      docs: items,
      total: totalItems,
      page: page,
      pages: Math.ceil(totalItems / limit),
      limit,
    };

    return pagination;
  }

  async findById(id: string): Promise<UserDocument | null> {
    this.logger.debug(`Finding user by id: ${id}`);
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      this.logger.warn(`User not found with id: ${id}`);
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findValidatedUser(
    query: Partial<Pick<User, 'email' | 'phone' | 'group'>>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        ...query,
        status: Status.VALIDATED,
      })
      .exec();
  }

  async updateById(
    id: string,
    payload: UpdateUserPayloadDto,
  ): Promise<UserDocument> {
    this.logger.log(`Updating user with id: ${id}`);
    const { updatedAt, ...data } = payload;
    const exists = await this.userModel.exists({ _id: id });

    if (!exists) {
      this.logger.warn(`User not found for update with id: ${id}`);
      throw new NotFoundException('User not found');
    }

    await this.validateUniqueFields(payload, { excludeId: id });

    const fullName = this.generateFullName(payload);
    if (fullName) {
      data.fullName = fullName;
    }

    if (payload.password) {
      data.password = bcrypt.hashSync(
        payload.password,
        parseInt(this.configService.get('SALT_ROUND', '', { infer: true })),
      );
    }

    // Optimistic concurrency check using updatedAt
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: id, updatedAt: new Date(updatedAt) },
        { $set: data },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      this.logger.error(
        `Outdated version detected during update for user: ${id}`,
      );
      throw new OutdatedEntityVersionError(
        'an old version of User was detected during the update',
        'User',
        '409',
      );
    }

    this.logger.log(`User updated successfully with id: ${id}`);
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting user with id: ${id}`);
    await this.userModel.findByIdAndDelete(id).exec();
    this.logger.log(`User deleted successfully with id: ${id}`);
  }

  private buildWhere(filters: FilterUsersQueryDto): Record<string, any> {
    const {
      firstName,
      middleName,
      lastName,
      secondLastName,
      phone,
      fullName,
      ...otherFilters
    } = filters;
    const where: Record<string, any> = { ...otherFilters };

    if (phone) where.phone = { $regex: phone, $options: 'i' };
    if (firstName) where.firstName = { $regex: firstName, $options: 'i' };
    if (middleName) where.middleName = { $regex: middleName, $options: 'i' };
    if (lastName) where.lastName = { $regex: lastName, $options: 'i' };
    if (secondLastName)
      where.secondLastName = { $regex: secondLastName, $options: 'i' };

    if (fullName) {
      const parts = fullName
        .split(' ')
        .map((p) => p.trim())
        .filter((p) => p.length >= 2);

      if (parts.length > 0) {
        where.$and = parts.map((p) => ({
          fullName: { $regex: p, $options: 'i' },
        }));
      }
    }

    return where;
  }

  private async validateUniqueFields(
    payload: Partial<CreateUserPayloadDto | UpdateUserPayloadDto>,
    options: ValidateUniqueOptions = {},
  ): Promise<void> {
    const {
      excludeId,
      group,
      emailStatusFilter = false,
      statusAllowed,
    } = options;

    const phone = payload.phone?.toString().trim() || undefined;
    const email = payload.email?.toString().trim().toLowerCase() || undefined;
    const rfc = payload.rfc?.toString().trim() || undefined;
    const curp = payload.curp?.toString().trim() || undefined;

    const checks: any[] = [];
    if (phone) checks.push({ phone });
    if (rfc) checks.push({ rfc });
    if (curp) checks.push({ curp });

    if (email) {
      if (emailStatusFilter) {
        const allowed = statusAllowed ?? [
          Status.REGISTERED,
          Status.VALIDATED,
          Status.BLOCKED,
          Status.CREATED,
        ];
        const emailCond: mongoose.QueryFilter<User> = {
          email,
          status: { $in: allowed },
          ...(group ? { group } : {}),
        };
        checks.push(emailCond);
      } else {
        checks.push({ email });
      }
    }

    if (checks.length === 0) return;

    const query: mongoose.QueryFilter<User> = {
      $or: checks,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    };

    const matches = await this.userModel.find(query).exec();

    if (!matches || matches.length === 0) return;

    const conflicts = new Set<string>();
    for (const row of matches) {
      if (phone && row.phone === phone) conflicts.add('phone');
      if (email && row.email?.toLowerCase() === email) conflicts.add('email');
      if (rfc && row.rfc === rfc) conflicts.add('rfc');
      if (curp && row.curp === curp) conflicts.add('curp');
    }

    if (conflicts.size === 0) return;

    this.logger.warn(
      `User validation failed. Conflicts detected: ${Array.from(conflicts).join(', ')}`,
    );
    throw new ConflictException({
      message: 'Conflict: the following fields are already in use',
      conflicts: Array.from(conflicts),
    });
  }

  private generateFullName(
    payload: CreateUserPayloadDto | UpdateUserPayloadDto,
  ): string {
    let fullName = '';
    if (payload.firstName) fullName = payload.firstName.trim();
    if (payload.middleName) fullName += ` ${payload.middleName.trim()}`;
    if (payload.lastName) fullName += ` ${payload.lastName.trim()}`;
    if (payload.secondLastName) fullName += ` ${payload.secondLastName.trim()}`;
    return fullName.trim();
  }
}
