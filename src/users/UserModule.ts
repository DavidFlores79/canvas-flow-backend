import { Module } from '@nestjs/common';
import { UserController } from './controller/UserController';
import { UserService } from './service/UserService';
import { User } from './entity/User';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entity/Address';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [UserController],
  providers: [UserService, ConfigService],
  imports: [TypeOrmModule.forFeature([User, Address])],
  exports: [UserService],
})
export class UserModule {}
