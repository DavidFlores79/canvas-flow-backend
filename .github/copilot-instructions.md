# NestJS Base Project - AI Coding Assistant Instructions

## Project Overview

This is a **NestJS base template** demonstrating enterprise-grade API architecture with TypeORM, PostgreSQL, and comprehensive error handling. The `investment-products` module serves as a **reference implementation pattern** and should be used as a template for creating new business modules.

## Architecture Patterns

### Module Structure (Follow investment-products example)
```
src/[module-name]/
├── [Module]Module.ts          # NestJS module definition
├── controller/
│   ├── [Module]Controller.ts      # REST endpoints
│   └── [Module]Controller.spec.ts # Controller tests
├── service/
│   ├── [Module]Service.ts         # Business logic
│   └── [Module]Service.spec.ts    # Service tests
├── dto/                       # Data Transfer Objects
│   ├── Create[Entity]PayloadDto.ts
│   ├── Update[Entity]PayloadDto.ts
│   ├── Filter[Entity]QueryDto.ts
│   └── [Entity]Dto.ts
├── entity/
│   └── [Entity].ts               # TypeORM entity
└── interface/
    └── [Entity].ts               # TypeScript interfaces
```

### Required Patterns
- **Controller → Service → Repository**: Thin controllers, business logic in services
- **UUID Primary Keys**: All entities use `@PrimaryGeneratedColumn('uuid')`
- **Custom Error Classes**: Use `shared/error/` classes (DuplicateEntityError, NotFoundEntityError, etc.)
- **DTO Validation**: All inputs/outputs must use class-validator decorators
- **Swagger Documentation**: All endpoints require `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`

### Environment Configuration
- Multi-env system: `base.env` + environment-specific files
- Set `DEPLOY_ENV` variable to load appropriate config
- Use `EnvironmentVariables` interface for type safety

## Critical Developer Commands

```bash
## Critical Developer Commands

```bash
# Development (always use yarn, never npm)
yarn start:dev              # Hot reload development server
yarn build && yarn cp:env   # Build with environment files

# Database Operations
yarn migration:generate     # Generate TypeORM migration after entity changes
yarn db:migrate             # Run pending migrations
yarn migration:revert       # Rollback last migration

# Testing (NO EXCEPTIONS - all code must have tests)
yarn test                   # Unit tests
yarn test:cov              # Coverage report (must be >80%)
yarn test:e2e              # End-to-end tests

# Code Quality
yarn lint:fix              # ESLint with auto-fix
yarn format                # Prettier formatting
```
yarn start:dev              # Hot reload development server
yarn build && yarn cp:env   # Build with environment files

# Database Operations
yarn migration:generate     # Generate TypeORM migration after entity changes
yarn db:migrate             # Run pending migrations
yarn migration:revert       # Rollback last migration

# Testing (NO EXCEPTIONS - all code must have tests)
yarn test                   # Unit tests
yarn test:cov              # Coverage report (must be >80%)
yarn test:e2e              # End-to-end tests

# Code Quality
yarn lint:fix              # ESLint with auto-fix
yarn format                # Prettier formatting
```

## Code Conventions

### File Headers
Every file must start with:
```typescript
// ABOUTME: Brief description of what this file does
// ABOUTME: Second line with additional context if needed
```

### Import Organization
```typescript
// 1. NestJS imports
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 2. Third-party imports
import { DataSource } from 'typeorm';

// 3. Local imports (relative paths with .js extension)
import { Entity } from './entity/Entity.js';
import { Service } from './service/Service';
```

### Error Handling Flow
1. Services throw custom exceptions from `shared/error/`
2. `HttpExceptionFilter` intercepts and maps to HTTP status codes
3. Sentry automatically captures all errors
4. Client receives consistent error format

## Workflow Integration

### Claude Workflow Commands (use these for complex features)
- `explore-plan <feature-description>` - Architecture planning with nestjs-backend-architect
- `create-new-gh-branch <feature-description>` - GitHub issue & branch creation
- `start-working-on-branch-new <branch-name>` - TDD implementation with testing
- `run-tests [scope]` - Comprehensive testing (unit/integration/e2e)
- `update-feedback <pr-number>` - CI/CD feedback loop until PR is merged

### .Claude Folder Workflow Structure

The `.claude/` folder contains the complete development workflow automation:

#### Agents Available:
- **`nestjs-backend-architect`** - Main agent for NestJS backend development
- **`qa-criteria-validator`** - Acceptance criteria definition and Jest/Supertest validation
- **`ui-ux-analyzer`** - For frontend apps only (not applicable to this NestJS backend)
- **`angular-frontend-developer`** - For Angular frontend development
- **`flutter-frontend-developer`** - For Flutter app development
- **`laravel-backend-architect`** - For Laravel backend development

#### Session Management:
- **Implementation plans**: `.claude/sessions/context_session_{feature_name}.md`
- **Agent documentation**: `.claude/doc/{feature_name}/nestjs-backend.md`
- **QA validation plans**: `.claude/doc/{feature_name}/qa_validation_plan.md`
- Always load session context before starting work on existing features

#### Complete Workflow Process:
1. **Planning Phase**: `explore-plan` creates session file with nestjs-backend-architect
2. **Branch Creation**: `create-new-gh-branch` uses session info to create GitHub issue and branch
3. **Development Phase**: `start-working-on-branch-new` implements using session plan and TDD
4. **Testing Phase**: Integrated Jest unit tests, Supertest integration tests, and e2e tests
5. **Feedback Loop**: `update-feedback` cycles through plan→implement→test until PR is merged

#### Agent Selection for NestJS Projects:
- **Backend API only**: Use `nestjs-backend-architect` + `qa-criteria-validator`
- **NestJS + Angular**: Use `nestjs-backend-architect` + `angular-frontend-developer` + `qa-criteria-validator`
- **NestJS + Flutter**: Use `nestjs-backend-architect` + `flutter-frontend-developer` + `qa-criteria-validator`

## Testing Requirements

**NO EXCEPTIONS POLICY**: All code must include:
- Unit tests for services and controllers
- Integration tests for database operations
- E2E tests for complete API workflows
- Minimum 80% code coverage

### Test Patterns
```typescript
// Service Test Pattern
describe('InvestmentProductService', () => {
  let service: InvestmentProductService;
  let repository: Repository<InvestmentProduct>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentProductService,
        {
          provide: getRepositoryToken(InvestmentProduct),
          useClass: Repository,
        },
      ],
    }).compile();
    // ... setup
  });
});
```

## Adding New Business Modules

### Using Claude Workflow (Recommended for Complex Features):
```bash
# 1. Plan architecture and create session
explore-plan "Product catalog with categories and inventory management"

# 2. Create GitHub issue and branch
create-new-gh-branch "Product catalog with categories and inventory management"

# 3. Implement with TDD using session plan
start-working-on-branch-new feat/product-catalog

# 4. Handle feedback until merged
update-feedback <pr-number>
```

### Manual Implementation Steps:
1. **Create module structure** following investment-products pattern
2. **Define TypeORM entity** with proper decorators and relationships
3. **Generate migration**: `yarn migration:generate`
4. **Implement service** with CRUD operations and custom business logic
5. **Create controller** with validation, documentation, and error handling
6. **Write comprehensive tests** for all functionality (Jest + Supertest)
7. **Update AppModule.ts** to import new module
8. **Run migration**: `yarn db:migrate`

## Database Patterns

### Entity Definition
```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({
    name: 'snake_case_column',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  decimalField: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

### Service Pattern with Error Handling
```typescript
@Injectable()
export class EntityService {
  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
  ) {}

  async create(dto: CreateEntityDto): Promise<Entity> {
    try {
      const entity = this.repository.create(dto);
      return await this.repository.save(entity);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new DuplicateEntityError('Entity already exists', 'Entity', error.code);
      }
      throw error;
    }
  }
}
```

## Integration Points

- **Sentry**: Automatic error tracking and performance monitoring via `instrument.ts`
- **TypeORM**: Database layer with migrations in `src/database/migrations/`
- **Swagger**: Auto-generated API docs at `/api` endpoint
- **Health Checks**: Available at `/health` via CoreModule

## Common Pitfalls to Avoid

- Never use `any` type - maintain strict TypeScript typing
- Don't create controllers without corresponding tests
- Avoid direct database queries - use repository pattern
- Never skip migration generation after entity changes
- Don't implement business logic in controllers
- Always validate input DTOs with class-validator decorators
- Never commit without running tests and ensuring they pass