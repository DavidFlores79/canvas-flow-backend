# NestJS Backend Implementation Plan: Fix Auth and Users Modules

## Overview
Fix errors in authentication and users modules by removing non-existent dependencies and implementing a full authentication suite with Role-Based Access Control (RBAC), while keeping existing User entity structure and Address management.

## User Requirements Confirmed
- **Authentication**: Full suite + Role-Based Access Control (RBAC)
- **User Management**: User profiles + Address management (keep existing Address entity)
- **Database**: Keep current User entity structure and Address relationship as-is
- **Environment**: Add JWT vars to existing base.env and environment-specific files
- **Testing**: Focus on fixing compilation errors first, add tests later

## Current Issues Identified

### 1. Missing Module Dependencies
- `SmsValidationModule` - Referenced but doesn't exist
- `UserBalanceModule` - Referenced but doesn't exist  
- `ProviderAccountModule` - Referenced but doesn't exist
- `UserBalanceTransaction` entity - Referenced but doesn't exist

### 2. Architecture Inconsistencies
- Not following investment-products module structure
- Missing proper error handling with shared error classes
- Incomplete DTO validation patterns
- Missing Swagger documentation
- Not imported in AppModule.ts

## Implementation Plan

### Phase 1: Clean Up AuthModule Dependencies

#### Files to Modify:
1. **`src/auth/AuthModule.ts`**
   - Remove imports: `SmsValidationModule`, `UserBalanceModule`, `ProviderAccountModule`
   - Remove TypeORM entities: `UserBalance`, `UserBalanceTransaction`
   - Keep only: `UserModule`, `JwtService`, `ConfigService`
   - Add JwtModule configuration

```typescript
// New AuthModule.ts structure
@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRY', { infer: true }) || '30m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
```

2. **`src/auth/service/AuthService.ts`**
   - Remove all SMS validation related imports and methods
   - Remove user balance related imports and methods  
   - Remove provider account related imports and methods
   - Keep core authentication: login, register, refresh token, password reset
   - Add proper error handling using shared error classes
   - Simplify to core JWT authentication functionality

#### Core AuthService Methods to Keep:
```typescript
- signIn(signInDto: SignInUserPayloadDto): Promise<UserSessionDto>
- signUp(signUpDto: SignUpPayloadDto): Promise<UserSessionDto>  
- validateUser(email: string, password: string): Promise<User | null>
- generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }>
- refreshToken(refreshDto: RefreshTokenPayloadDto): Promise<RefreshTokenResponseDto>
- resetPassword(email: string): Promise<void>
- completePasswordReset(resetDto: CompleteRecoverPasswordPayloadDto): Promise<void>
```

### Phase 2: Adapt to Current Project Architecture

#### 1. Follow Investment-Products Module Pattern

**File Structure to Match:**
```
src/auth/
├── AuthModule.ts
├── controller/
│   ├── AuthController.ts
│   └── AuthController.spec.ts
├── service/
│   ├── AuthService.ts
│   └── AuthService.spec.ts
├── dto/
│   ├── SignInPayloadDto.ts
│   ├── SignUpPayloadDto.ts
│   ├── RefreshTokenPayloadDto.ts
│   ├── UserSessionDto.ts
│   └── JwtDto.ts
├── guard/
│   ├── JwtAuthGuard.ts
│   └── LocalAuthGuard.ts
├── strategy/
│   ├── JwtStrategy.ts
│   └── LocalStrategy.ts
└── interface/
    ├── JwtPayload.ts
    └── AuthenticatedUser.ts
```

#### 2. Update User Module Structure

**Files to Modify:**
1. **`src/users/UserModule.ts`** - Already follows pattern, no changes needed
2. **`src/users/entity/User.ts`** - Review and align with investment-products entity pattern
3. **`src/users/service/UserService.ts`** - Add proper error handling
4. **`src/users/controller/UserController.ts`** - Add Swagger documentation and validation

### Phase 3: Add Missing Components

#### 1. JWT Configuration
**New File: `src/config/jwt.config.ts`**
```typescript
import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './EnvironmentVariables';

export const jwtConfig = (
  configService: ConfigService<EnvironmentVariables>,
): JwtModuleOptions => ({
  secret: configService.get('JWT_SECRET', { infer: true }),
  signOptions: {
    expiresIn: configService.get('JWT_EXPIRY', { infer: true }) || '30m',
  },
});
```

#### 2. Environment Variables
**Update: `src/config/EnvironmentVariables.ts`**
```typescript
// Add JWT configuration
JWT_SECRET: string;
JWT_EXPIRY: string;
JWT_REFRESH_SECRET: string;
JWT_REFRESH_EXPIRY: string;
```

#### 3. Authentication Guards
**New File: `src/auth/guard/JwtAuthGuard.ts`**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

#### 4. JWT Strategy  
**New File: `src/auth/strategy/JwtStrategy.ts`**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### Phase 4: Clean Up DTOs and Add Validation

#### Files to Update:
1. **Authentication DTOs** - Add proper class-validator decorators
2. **User DTOs** - Align with investment-products DTO pattern
3. **Add Response DTOs** - Following current project patterns

#### Example DTO Updates:
```typescript
// src/auth/dto/SignInPayloadDto.ts
export class SignInPayloadDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'password123' })
  password: string;
}
```

### Phase 5: Error Handling Integration

#### Use Shared Error Classes:
```typescript
// In AuthService
import { NotFoundEntityError } from '../../shared/error/NotFoundEntityError';
import { DuplicateEntityError } from '../../shared/error/DuplicateEntityError';
import { UnprocessableEntityError } from '../../shared/error/UnprocessableEntityError';

// Implementation
if (!user) {
  throw new NotFoundEntityError('User not found', 'User', email);
}

if (existingUser) {
  throw new DuplicateEntityError('Email already exists', 'User', 'email');
}
```

### Phase 6: Add to AppModule

#### Update `src/AppModule.ts`:
```typescript
@Module({
  imports: [
    // ... existing imports
    AuthModule,
    UserModule,
  ],
  // ...
})
```

### Phase 7: Testing Strategy

#### Test Files to Create/Update:
1. **`src/auth/service/AuthService.spec.ts`** - Clean up and add comprehensive tests
2. **`src/auth/controller/AuthController.spec.ts`** - Add Supertest integration tests  
3. **`src/users/service/UserService.spec.ts`** - Review and enhance tests
4. **`src/users/controller/UserController.spec.ts`** - Add comprehensive tests

#### Test Patterns to Follow:
- Follow investment-products test patterns
- Use Jest for unit tests
- Use Supertest for integration tests
- Mock external dependencies
- Achieve >80% code coverage

### Phase 8: Environment Configuration

#### Update Environment Files:
**`environment/base.env`**
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRY=30m
JWT_REFRESH_SECRET=your-refresh-secret-here  
JWT_REFRESH_EXPIRY=7d
```

### Phase 9: Database Migration

#### Create Migration for Authentication Tables:
```bash
yarn migration:generate -- src/database/migrations/UpdateAuthTables
```

#### Migration Content:
- Ensure User table has proper constraints
- Add refresh_token table if needed
- Add password_reset_tokens table
- Remove any references to non-existent tables

## Files Summary

### Files to Delete:
- Any SMS validation references
- User balance related code  
- Provider account related code

### Files to Create:
- `src/auth/guard/JwtAuthGuard.ts`
- `src/auth/guard/LocalAuthGuard.ts`
- `src/auth/strategy/JwtStrategy.ts`
- `src/auth/strategy/LocalStrategy.ts`  
- `src/config/jwt.config.ts`
- Database migration files

### Files to Modify:
- `src/auth/AuthModule.ts`
- `src/auth/service/AuthService.ts` 
- `src/auth/controller/AuthController.ts`
- `src/users/service/UserService.ts`
- `src/users/controller/UserController.ts`
- `src/config/EnvironmentVariables.ts`
- `src/AppModule.ts`
- All DTO files (add validation)
- All test files

## Dependencies to Add

```json
{
  "@nestjs/passport": "^10.0.0",
  "@nestjs/jwt": "^10.0.0", 
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.1",
  "passport-local": "^1.0.0",
  "bcrypt": "^5.1.0"
}
```

## Success Criteria

1. ✅ All modules compile without errors
2. ✅ No references to non-existent modules  
3. ✅ Auth and User modules imported in AppModule
4. ✅ Core authentication functionality working
5. ✅ Proper error handling implemented
6. ✅ Comprehensive test coverage (>80%)
7. ✅ Swagger documentation complete
8. ✅ Database migrations successful
9. ✅ Environment configuration properly set up
10. ✅ Code follows investment-products patterns

This plan removes all problematic dependencies while maintaining core authentication functionality and adapting the modules to follow the current project's established patterns.