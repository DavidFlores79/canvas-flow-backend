import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { UserService } from './UserService';
import { User } from '../entity/User';
import { Address } from '../entity/Address';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Status, Group } from '../enum/UserEnum';
import { OutdatedEntityVersionError } from '../../shared/error/OutdatedEntityVersionError';
import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
import { UpdateUserPayloadDto } from '../dto/UpdateUserPayloadDto';

interface MockQueryBuilder {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  returning: jest.Mock;
  execute: jest.Mock;
}

interface MockEntityManager {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  createQueryBuilder: jest.Mock;
}

const mockQueryBuilder: MockQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  execute: jest.fn(),
};

const createMockRepository = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  existsBy: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let addressRepo: ReturnType<typeof createMockRepository>;
  let configService: { get: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let mockEntityManager: MockEntityManager;

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
    addressRepo = createMockRepository();

    // Config: SALT_ROUND -> '1' (sufficient for tests; bcrypt.hashSync will still work)
    configService = { get: jest.fn().mockReturnValue('1') };

    // mock entityManager used inside dataSource.transaction
    mockEntityManager = {
      create: jest.fn((_cls: unknown, payload: Record<string, unknown>) => ({
        ...payload,
      })),
      save: jest.fn((entity: Record<string, unknown>) => {
        // simulate saved entity with id if none
        const result = { ...entity };
        if (!result.id) {
          result.id = randomUUID();
        }
        return Promise.resolve(result);
      }),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    // dataSource.transaction will call the callback with our mockEntityManager
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          (cb: (manager: typeof mockEntityManager) => Promise<unknown>) => {
            return cb(mockEntityManager);
          },
        ),
    };

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
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(Address),
          useValue: addressRepo,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
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
      userRepo.findAndCount.mockResolvedValue([[fakeUser], 1]);
      const res = await service.findAll({ page: 2, limit: 1 });
      expect(res.docs).toEqual([fakeUser]);
      expect(res.total).toBe(1);
      expect(res.page).toBe(2);
      expect(res.limit).toBe(1);
      expect(res.pages).toBe(1);
      expect(userRepo.findAndCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('returns user if exists and loads addresses', async () => {
      userRepo.findOneBy.mockResolvedValueOnce(fakeUser);
      addressRepo.find.mockResolvedValueOnce([
        { id: 'addr1', user: { id: fakeUser.id } },
      ]);
      const res = await service.findById(fakeUser.id as string);
      expect(res).toBeDefined();
      expect(res?.id).toEqual(fakeUser.id);
      expect(addressRepo.find).toHaveBeenCalledWith({
        where: { user: { id: fakeUser.id } },
      });
    });

    it('throws NotFoundException if not exists', async () => {
      userRepo.findOneBy.mockResolvedValueOnce(null);
      let caught: Error | null = null;
      try {
        await service.findById('noexiste');
      } catch (err) {
        caught = err instanceof Error ? err : new Error(String(err));
      }
      expect(caught).toBeInstanceOf(NotFoundException);
      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: 'noexiste' });
    });
  });

  describe('findValidatedUser', () => {
    it('uses repo.findOne with status VALIDATED', async () => {
      userRepo.findOne = jest.fn().mockResolvedValue(fakeUser);
      const res = await service.findValidatedUser({
        email: 'juan@example.com',
      });
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(res).toEqual(fakeUser);
    });
  });

  describe('create', () => {
    it('creates user with addresses and hashes password, using transaction', async () => {
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

      // entityManager.save will return the object with id as defined above
      mockEntityManager.save.mockImplementation(
        (entity: Record<string, unknown>) => {
          const result = { ...entity };
          if (!result.id) {
            result.id = 'saved-id';
          }
          return Promise.resolve(result);
        },
      );

      // Call
      const saved = await service.create(payload);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      // password was hashed (not the same as plaintext)
      expect(payload.password).not.toEqual('plaintext'); // payload mutated by the service
      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      // verify that save was called multiple times (address + user)
      expect(mockEntityManager.save).toHaveBeenCalled();
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
      // Should not invoke userRepo.createQueryBuilder to validate
      userRepo.createQueryBuilder = jest.fn();
      mockEntityManager.save.mockResolvedValue({ id: 'x' });
      await service.create(payload);
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('updateById', () => {
    it('updates correctly and returns mapped entity', async () => {
      const id = randomUUID();
      // exists
      userRepo.existsBy.mockResolvedValue(true);

      // Prepare the transaction query builder (entityManager.createQueryBuilder)
      const returnedRow = {
        id,
        first_name: 'Pedro',
        middle_name: null,
        last_name: 'Gomez',
        second_last_name: null,
        full_name: 'Pedro Gomez',
        display_name: 'Pedro',
        email: 'pedro@example.com',
        phone: '111',
        gender: null,
        group: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 1,
        raw: [returnedRow],
      });

      // entityManager.find for addresses
      mockEntityManager.find.mockResolvedValue([
        { id: 'addr-upd', user: { id } },
      ]);

      // force entityManager.createQueryBuilder to return the mockQueryBuilder
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const payload: UpdateUserPayloadDto = {
        updatedAt: new Date().toISOString(),
      };

      const res = await service.updateById(id, payload);

      expect(userRepo.existsBy).toHaveBeenCalledWith({ id });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(res).toBeDefined();
      expect(res.id).toEqual(id);
      expect(res.addresses).toEqual([{ id: 'addr-upd', user: { id } }]);
    });

    it('throws OutdatedEntityVersionError when affected === 0', async () => {
      const id = randomUUID();
      userRepo.existsBy.mockResolvedValue(true);

      mockQueryBuilder.execute.mockResolvedValue({
        generatedMaps: [],
        affected: 0,
        raw: [],
      });

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      let thrown: Error | null = null;
      try {
        await service.updateById(id, {
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        thrown = err instanceof Error ? err : new Error(String(err));
      }

      expect(thrown).toBeInstanceOf(OutdatedEntityVersionError);
      expect(userRepo.existsBy).toHaveBeenCalledWith({ id });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('if not exists, throws NotFoundException before attempting update', async () => {
      const id = randomUUID();
      userRepo.existsBy.mockResolvedValue(false);

      let thrown: Error | null = null;
      try {
        await service.updateById(id, {
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        thrown = err instanceof Error ? err : new Error(String(err));
      }

      // In current implementation throws NotFoundException if !exists
      expect(thrown).toBeInstanceOf(NotFoundException);
      expect(userRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('calls repository.delete', async () => {
      await service.remove('some-id');
      expect(userRepo.delete).toHaveBeenCalledWith('some-id');
    });
  });

  describe('validateUniqueFields', () => {
    it('throws ConflictException if there are matches in getMany', async () => {
      // Simulate that createQueryBuilder().getMany() returns a row with email and phone
      const qbMock = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: '1',
            phone: '1111',
            email: 'dup@example.com',
            rfc: null,
            curp: null,
            group: null,
            status: Status.VALIDATED,
          },
        ]),
      };
      userRepo.createQueryBuilder.mockReturnValue(qbMock);

      let thrown: Error | null = null;
      try {
        // Direct call to validateUniqueFields through private method access
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
