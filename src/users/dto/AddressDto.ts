// src/users/dto/address.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Address } from '../entity/Address';

export class AddressDto {
  @ApiProperty({
    type: String,
    required: false,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Street name',
    example: 'Main St',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'External number',
    example: '123',
  })
  @IsOptional()
  @IsString()
  externalNumber?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Internal number',
    example: '375A',
  })
  @IsOptional()
  @IsString()
  internalNumber?: string;

  @ApiProperty({
    type: String,
    description: 'City code',
    example: '01',
  })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Suburb code',
    example: '0621',
  })
  @IsOptional()
  @IsString()
  suburb?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'County code',
    example: '050',
  })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiProperty({
    type: String,
    description: 'State code',
    example: 'YUC',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    type: String,
    description: 'Zip code',
    example: '97246',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @ApiProperty({
    type: String,
    description: 'Country code',
    example: 'MX',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  country: string;

  static buildDto(address: Address): AddressDto {
    const dto = new AddressDto();
    dto.id = address.id;
    dto.street = address.street;
    dto.externalNumber = address.externalNumber;
    dto.internalNumber = address.internalNumber;
    dto.city = address.city;
    dto.suburb = address.suburb;
    dto.county = address.county;
    dto.state = address.state;
    dto.zipCode = address.zipCode;
    dto.country = address.country;
    return dto;
  }
}
