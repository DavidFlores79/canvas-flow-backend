import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
import { UpdateUserPayloadDto } from '../dto/UpdateUserPayloadDto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/User';
import { Brackets, DataSource, ILike, Raw, Repository } from 'typeorm';
import { FilterUsersQueryDto } from '../dto/FilterUsersQueryDto';
import { PaginatedResult } from '../../shared/interface/Pagination';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { UserInterface } from '../interface/UserInterface';
import { Address } from '../entity/Address';
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private readonly configService: ConfigService<EnvironmentVariables>,
    readonly dataSource: DataSource,
  ) {}

  async create(payload: CreateUserPayloadDto): Promise<User> {
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

    this.logger.debug(`Starting transaction to create user: ${payload.phone}`);
    return this.dataSource.transaction(async (entityManager) => {
      const user = entityManager.create(User, {
        ...payload,
        fullName,
      });

      const addresses = payload.addresses;
      if (addresses && addresses.length > 0) {
        for (const address of addresses) {
          const addressEntity = entityManager.create(Address, address);
          addressEntity.user = user;
          await entityManager.save(addressEntity);
        }
      }

      //add addreses to user
      user.addresses = addresses as Address[];
      await entityManager.save(user);
      const savedUser = await entityManager.save(user);
      this.logger.log(`User created successfully with id: ${savedUser.id}`);
      return savedUser;
    });
  }

  async findAll(
    filterUsersQueryDto: FilterUsersQueryDto,
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, ...filters } = filterUsersQueryDto;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [items, totalItems] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    const pagination: PaginatedResult<User> = {
      docs: items,
      total: totalItems,
      page: page,
      pages: Math.ceil(totalItems / limit),
      limit,
    };

    return pagination;
  }

  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by id: ${id}`);
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      this.logger.warn(`User not found with id: ${id}`);
      throw new NotFoundException('User not found');
    }

    user.addresses = await this.addressRepository.find({
      where: { user: { id } },
    });

    return user;
  }

  // return user with addresses
  async findValidatedUser(
    query: Partial<Pick<User, 'email' | 'phone' | 'group'>>,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      relations: ['addresses'],
      where: {
        ...query,
        status: Status.VALIDATED,
      },
    });
  }

  async updateById(id: string, payload: UpdateUserPayloadDto): Promise<User> {
    this.logger.log(`Updating user with id: ${id}`);
    const { updatedAt, addresses, ...data } = payload;
    const exists = await this.userRepository.existsBy({ id });

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

    this.logger.debug(`Starting transaction to update user: ${id}`);
    return this.dataSource.transaction(async (entityManager) => {
      // 1) Manejo de direcciones (update/create) dentro de la transacción
      if (addresses && addresses.length > 0) {
        this.logger.debug(
          `Updating ${addresses.length} addresses for user: ${id}`,
        );
        for (const address of addresses as Array<Partial<Address>>) {
          if (address.id) {
            // actualizar si existe y pertenece al usuario
            const existingAddress = await entityManager.findOne(Address, {
              where: { id: address.id, user: { id } },
            });

            if (existingAddress) {
              Object.assign(existingAddress, address);
              await entityManager.save(existingAddress);
            } else {
              // si no existe (o no pertenece), creamos y asociamos al usuario
              const newAddress = entityManager.create(Address, address);
              // asociamos por id para evitar cargar el user completo
              newAddress.user = { id } as User;
              await entityManager.save(newAddress);
            }
          } else {
            // crear nueva dirección
            const newAddress = entityManager.create(Address, address);
            newAddress.user = { id } as User;
            await entityManager.save(newAddress);
          }
        }
      }

      // 2) Actualizar usuario con comprobación de versión (updated_at)
      // Usamos queryBuilder del manager para incluir la condición en el WHERE
      const result = await entityManager
        .createQueryBuilder()
        .update(User)
        .set(data)
        .where(
          'id = :id AND updated_at::timestamp(2) = :updatedAt::timestamp(2)',
          { id, updatedAt },
        )
        .returning('*')
        .execute();

      if (result.affected === 0) {
        this.logger.error(
          `Outdated version detected during update for user: ${id}`,
        );
        throw new OutdatedEntityVersionError(
          'an old version of User  was detected during the update',
          'InvestmentProduct',
          '409',
        );
      }

      // 3) Mapear la fila resultante a la entidad User (igual que en tu código)
      const rows = result.raw as UserInterface[];
      const row = rows[0];

      const entity = new User();
      entity.id = row.id;
      entity.firstName = row.first_name;
      entity.middleName = row.middle_name;
      entity.lastName = row.last_name;
      entity.secondLastName = row.second_last_name;
      entity.fullName = row.full_name;
      entity.displayName = row.display_name;
      entity.email = row.email;
      entity.phone = row.phone;
      entity.gender = row.gender;
      entity.group = row.group;
      entity.nationality = row.nationality;
      entity.rfc = row.rfc;
      entity.curp = row.curp;
      entity.birthDate = row.birth_date ? new Date(row.birth_date) : undefined;
      entity.countryOfBirth = row.country_of_birth;
      entity.stateOfBirth = row.state_of_birth;
      entity.riskLevel = row.risk_level;
      entity.status = row.status;
      entity.verified = row.verified;
      entity.profileCompleted = row.profile_completed;
      entity.createdAt = row.created_at;
      entity.updatedAt = row.updated_at;

      // 4) Cargar direcciones con el mismo entityManager (para consistencia dentro de la tx)
      entity.addresses = await entityManager.find(Address, {
        where: { user: { id: row.id } },
      });

      this.logger.log(`User updated successfully with id: ${id}`);
      return entity;
    });
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting user with id: ${id}`);
    await this.userRepository.delete(id);
    this.logger.log(`User deleted successfully with id: ${id}`);
  }

  /**
   * Build a WHERE clause for the user query
   * @param filters FilterUsersQueryDto
   * @returns WHERE clause object
   */
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

    if (phone) {
      where.phone = ILike(`%${phone}%`);
    }
    if (firstName) {
      where.firstName = ILike(`%${firstName}%`);
    }
    if (middleName) {
      where.middleName = ILike(`%${middleName}%`);
    }
    if (lastName) {
      where.lastName = ILike(`%${lastName}%`);
    }
    if (secondLastName) {
      where.secondLastName = ILike(`%${secondLastName}%`);
    }

    if (fullName) {
      const parts = fullName
        .split(' ')
        .map((p) => p.trim())
        .filter((p) => p.length >= 2);

      if (parts.length > 0) {
        where.fullName = Raw(
          (alias) =>
            parts
              .map((_, i) => `${alias} ILIKE '%' || :part${i} || '%'`)
              .join(' AND '),
          parts.reduce(
            (acc, p, i) => ((acc[`part${i}`] = p), acc),
            {} as Record<string, string>,
          ),
        );
      }
    }

    return where;
  }

  /**
   * Validate unique fields for user creation
   * @param payload CreateUserPayloadDto
   * @throws ConflictException if user with same phone, rfc or curp already exists
   */
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

    // Normalizar inputs
    const phone = payload.phone?.toString().trim() || undefined;
    const email = payload.email?.toString().trim().toLowerCase() || undefined;
    const rfc = payload.rfc?.toString().trim() || undefined;
    const curp = payload.curp?.toString().trim() || undefined;

    const checks = [
      { key: 'phone', value: phone },
      { key: 'email', value: email },
      { key: 'rfc', value: rfc },
      { key: 'curp', value: curp },
    ].filter((c) => c.value);

    if (checks.length === 0) return;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.phone',
        'u.email',
        'u.rfc',
        'u.curp',
        'u.group',
        'u.status',
      ]);

    // Construir ORs para los campos a checar
    const or: string[] = [];
    const params: Record<string, any> = {};

    checks.forEach((c, i) => {
      const param = `${c.key}_${i}`;
      or.push(`u.${c.key} = :${param}`);
      params[param] = c.value;
    });

    qb.where(`(${or.join(' OR ')})`, params);

    if (excludeId) {
      qb.andWhere('u.id != :excludeId', { excludeId });
    }

    // Si queremos el comportamiento de validateExistUserEmail, añadimos restricciones
    if (emailStatusFilter && email) {
      const allowed = statusAllowed ?? [
        Status.REGISTERED,
        Status.VALIDATED,
        Status.BLOCKED,
        Status.CREATED,
      ];

      // Garantizamos que las filas devueltas con email cumplan también group/status
      qb.andWhere(
        new Brackets((qb2) => {
          qb2.where('u.email = :email_match', { email_match: email });
          if (group) qb2.andWhere('u.group = :group', { group });
          qb2.andWhere('u.status IN (:...allowed)', { allowed });
        }),
      );
    }

    const matches = await qb.getMany();

    if (!matches || matches.length === 0) return;

    const conflicts = new Set<string>();
    for (const row of matches) {
      if (phone && row.phone === phone) conflicts.add('phone');
      if (email && row.email?.toLowerCase() === email) {
        // si emailStatusFilter está activo, ya filtramos arriba las filas que no cumplen group/status
        conflicts.add('email');
      }
      if (rfc && row.rfc === rfc) conflicts.add('rfc');
      if (curp && row.curp === curp) conflicts.add('curp');
    }

    if (conflicts.size === 0) return;

    // Lanza conflicto con campos detectados (puedes adaptar mensaje/i18n)
    this.logger.warn(
      `User validation failed. Conflicts detected: ${Array.from(conflicts).join(', ')}`,
    );
    throw new ConflictException({
      message: 'Conflict: the following fields are already in use',
      conflicts: Array.from(conflicts),
    });
  }

  /**
   * Generate full name from available name parts
   * @param payload CreateUserPayloadDto | UpdateUserPayloadDto
   * @returns full name string
   */
  private generateFullName(
    payload: CreateUserPayloadDto | UpdateUserPayloadDto,
  ): string {
    let fullName = '';
    if (payload.firstName) {
      fullName = payload.firstName.trim();
    }

    if (payload.middleName) {
      fullName += ` ${payload.middleName.trim()}`;
    }

    if (payload.lastName) {
      fullName += ` ${payload.lastName.trim()}`;
    }

    if (payload.secondLastName) {
      fullName += ` ${payload.secondLastName.trim()}`;
    }

    return fullName.trim();
  }
}
