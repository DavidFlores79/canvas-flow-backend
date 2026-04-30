import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { UserService } from './UserService';
import { User } from '../schemas/UserSchema';
import { ConfigService } from '@nestjs/config';

import { Status, Group } from '../enum/UserEnum';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
import { UpdateUserPayloadDto } from '../dto/UpdateUserPayloadDto';

type MockModel = {
  new (dto: any): any;
  find: jest.Mock;
  countDocuments: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  findByIdAndDelete: jest.Mock;
  exists: jest.Mock;
  findOneAndUpdate: jest.Mock;
  updateOne: jest.Mock;
  createQueryBuilder: jest.Mock;
};

const createMockRepository = (): MockModel => {
  const mockModel = function (this: any, dto: any) {
    Object.assign(this, dto);
    const self = this as { save: jest.Mock };
    self.save = jest.fn().mockResolvedValue(this);
  } as unknown as MockModel;

  mockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });
  mockModel.countDocuments = jest.fn();
  mockModel.findById = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockModel.exists = jest.fn();
  mockModel.findOneAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockModel.updateOne = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockModel.createQueryBuilder = jest.fn();
  return mockModel;
};

describe('UserService', () => {
  let service: UserService;
  let userRepo: MockModel;
  let configService: { get: jest.Mock };

  const fakeUser: Partial<User> = {
    id: randomUUID(),
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@example.com',
    phone: '1234567890',
    fullName: 'Juan Perez',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    userRepo = createMockRepository();

    // Config: SALT_ROUND -> '1' (sufficient for tests; bcrypt.hashSync will still work)
    configService = { get: jest.fn().mockReturnValue('1') };

    // userRepo.createQueryBuilder default -> returns object with getMany mocked later per test
    userRepo.createQueryBuilder = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: userRepo,
        },

        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // avoid noisy logs in tests (optional)
    Object.defineProperty(service, 'logger', {
      value: new Logger('TEST'),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns pagination correctly', async () => {
      userRepo.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([fakeUser]),
      } as any);
      userRepo.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      } as any);
      const res = await service.findAll({ page: 2, limit: 1 });
      expect(res.docs).toEqual([fakeUser]);
      expect(res.total).toBe(1);
      expect(res.page).toBe(2);
      expect(res.limit).toBe(1);
      expect(res.pages).toBe(1);
      expect(userRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns user if exists', async () => {
      userRepo.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeUser),
      } as any);
      const res = await service.findById(fakeUser.id as string);
      expect(res).toBeDefined();
      expect(res?.id).toEqual(fakeUser.id);
    });

    it('throws NotFoundException if not exists', async () => {
      userRepo.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
      let caught: Error | null = null;
      try {
        await service.findById('noexiste');
      } catch (err: unknown) {
        caught = err instanceof Error ? err : new Error(String(err));
      }
      expect(caught).toBeInstanceOf(NotFoundException);
      expect(userRepo.findById).toHaveBeenCalledWith('noexiste');
    });
  });

  describe('findValidatedUser', () => {
    it('uses repo.findOne with status VALIDATED', async () => {
      userRepo.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeUser),
      } as any);
      const res = await service.findValidatedUser({
        email: 'juan@example.com',
      });
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(res).toEqual(fakeUser);
    });
  });

  describe('create', () => {
    it('creates user with addresses and hashes password', async () => {
      const payload: CreateUserPayloadDto = {
        firstName: 'Ana',
        lastName: 'Lopez',
        email: 'ana@example.com',
        password: 'plaintext',
        phone: '1234567890',
        group: Group.CLIENT_USER,
        addresses: [
          {
            street: 'Calle 1',
            city: 'Test City',
            state: 'Test State',
            country: 'MX',
            zipCode: '12345',
          },
        ],
        status: Status.CREATED,
      };

      userRepo.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const saved = await service.create(payload);

      expect(payload.password).not.toEqual('plaintext'); // payload mutated by the service
      expect(saved).toBeDefined();
    });

    it('does not validate uniqueness if status DUPLICATE', async () => {
      const payload: CreateUserPayloadDto = {
        firstName: 'Dup',
        email: 'dup@example.com',
        phone: '1234567890',
        password: 'test123',
        group: Group.CLIENT_USER,
        status: Status.DUPLICATE,
      };

      await service.create(payload);
    });
  });

  describe('updateById', () => {
    it('updates correctly and returns mapped entity', async () => {
      const id = randomUUID();
      userRepo.exists.mockResolvedValue(true);

      const returnedRow = {
        id,
        _id: id,
        firstName: 'Pedro',
        lastName: 'Gomez',
        email: 'pedro@example.com',
        phone: '111',
      };

      userRepo.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(returnedRow),
      } as any);
      userRepo.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(returnedRow),
      } as any);

      const payload: UpdateUserPayloadDto = {
        updatedAt: new Date().toISOString(),
      };

      const res = await service.updateById(id, payload);

      expect(userRepo.exists).toHaveBeenCalledWith({ _id: id });
      expect(userRepo.findOneAndUpdate).toHaveBeenCalled();
      expect(res).toBeDefined();
      expect(res.id).toEqual(id);
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      userRepo.exists.mockResolvedValue(true);

      userRepo.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      let thrown: Error | null = null;
      try {
        await service.updateById(id, {
          updatedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        thrown = err instanceof Error ? err : new Error(String(err));
      }

      expect(thrown).toBeInstanceOf(OutdatedEntityVersionError);
      expect(userRepo.exists).toHaveBeenCalledWith({ _id: id });
      expect(userRepo.findOneAndUpdate).toHaveBeenCalled();
    });

    it('if not exists, throws NotFoundException before attempting update', async () => {
      const id = randomUUID();
      userRepo.exists.mockResolvedValue(false);

      let thrown: Error | null = null;
      try {
        await service.updateById(id, {
          updatedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        thrown = err instanceof Error ? err : new Error(String(err));
      }

      expect(thrown).toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('calls repository.delete', async () => {
      await service.remove('some-id');
      expect(userRepo.findByIdAndDelete).toHaveBeenCalledWith('some-id');
    });
  });

  describe('validateUniqueFields', () => {
    it('throws ConflictException if there are matches in getMany', async () => {
      userRepo.find.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([
            { id: '1', phone: '1111', email: 'dup@example.com' },
          ]),
      } as any);

      let thrown: Error | null = null;
      try {
        await service['validateUniqueFields']({
          phone: '1111',
          email: 'dup@example.com',
        });
      } catch (err) {
        thrown = err instanceof Error ? err : new Error(String(err));
      }

      expect(thrown).toBeInstanceOf(ConflictException);
    });

    it('does not throw if there are no checks', async () => {
      // no phone/email/rfc/curp => returns without error
      await service['validateUniqueFields']({});
    });
  });
});
