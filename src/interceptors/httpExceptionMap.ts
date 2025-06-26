import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

export const map = new Map<
  string,
  | typeof NotFoundException
  | typeof BadRequestException
  | typeof ConflictException
>([
  ['DocumentNotFoundError', NotFoundException],
  ['ValidationError', BadRequestException],
  ['ValidatorError', BadRequestException],
  ['VersionError', ConflictException],
  ['CastError', BadRequestException],
  ['NotFoundEntityError', NotFoundException],
  ['DuplicateEntityError', ConflictException],
  ['OutdatedEntityVersionError', ConflictException],
  ['MongoServerError', ConflictException],
]);
