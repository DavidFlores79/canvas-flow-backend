# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **base NestJS project template** designed to serve as a foundation for new API projects. It demonstrates best practices for NestJS architecture, database integration, error handling, and testing patterns. The existing modules (`users`, `auth`, `sms-validation`) serve as **reference examples** showing how to structure new business modules.

## Architecture

### Tech Stack
- **Framework**: NestJS with TypeScript
- **Architecture**: Modular NestJS with layered structure
- **Database**: MongoDB with Mongoose
- **Validation**: class-validator + class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Monitoring**: Sentry for error tracking and performance
- **Testing**: Jest with NestJS testing utilities
- **Environment**: Multi-environment configuration system

### NestJS Modular Architecture

The codebase follows NestJS modular architecture with clear separation of concerns:

#### Core Structure
```
src/
  AppModule.ts         # Root application module
  main.ts              # Application entry point
  instrument.ts        # Sentry instrumentation setup

  config/              # Configuration management
    EnvironmentVariables.ts    # Type-safe environment variables
    typeOrmConfig.ts          # Database configuration

  core/                # Core/shared functionality
    CoreModule.ts      # Core module definition
    controller/        # Health checks, system info
    dto/               # Shared DTOs
    service/           # Core services

  database/            # Database layer
    DatabaseModule.ts  # Database module setup (Mongoose)

  shared/              # Shared utilities across modules
    decorator/         # Custom decorators
    dto/               # Common DTOs (pagination, etc.)
    error/             # Custom error classes
    interface/         # Shared interfaces

  [module-name]/       # Business modules (e.g., users, auth, sms-validation)
    [Module]Module.ts  # Module definition
    controller/        # REST controllers
    dto/               # Module-specific DTOs
    schemas/           # Mongoose schemas
      [Entity]Schema.ts
    interface/         # Module interfaces
    service/           # Business logic services

  interceptors/        # Global interceptors and filters
    HttpExceptionFilter.ts     # Global error handling
    httpExceptionMap.ts        # Error mapping
```

### Key Architectural Principles

1. **Modular Design**: Each business domain gets its own module with clear boundaries
2. **Dependency Injection**: NestJS IoC container manages all service dependencies
3. **Layered Structure**: Controller → Service → Repository pattern within modules
4. **Shared Resources**: Common functionality in `shared/` and `core/` modules
5. **Type Safety**: Strong typing throughout with TypeScript and class-validator
6. **Error Handling**: Centralized exception handling with custom error types

### Module Pattern (Reference: users, auth, sms-validation)

Each business module follows this structure:
```typescript
src/[module-name]/
  [Module]Module.ts    # NestJS module definition
  controller/          # REST API endpoints
    [Module]Controller.ts      # Main controller
    [Module]Controller.spec.ts # Controller tests
  service/             # Business logic
    [Module]Service.ts         # Main service
    [Module]Service.spec.ts    # Service tests
  dto/                 # Data Transfer Objects
    Create[Entity]PayloadDto.ts
    Update[Entity]PayloadDto.ts
    Filter[Entity]QueryDto.ts
    [Entity]Dto.ts
  schemas/             # Mongoose schemas
    [Entity]Schema.ts
  interface/           # TypeScript interfaces
    [Entity].ts
```

## Development Commands

### Running the Application

#### Using Docker (Recommended)
```bash
# Start all services (API + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f base-project-nest

# Restart API after code changes
docker-compose restart base-project-nest

# Stop all services
docker-compose down
```

The API will be available at `http://localhost:3000`

#### Local Development (Without Docker)
```bash
# Prerequisites: Node.js v22.x, PostgreSQL 16, Yarn
yarn install                  # Install dependencies
yarn start:dev                # Development server with hot reload
yarn start:debug              # Debug mode with hot reload
yarn build                    # Production build
yarn start:prod               # Production server

# Set environment (required)
# Windows PowerShell: $env:DEPLOY_ENV="local"
# Linux/Mac: export DEPLOY_ENV=local
```

### Testing

```bash
yarn test              # Run unit tests
yarn test:watch        # Run tests in watch mode  
yarn test:cov          # Run tests with coverage
yarn test:debug        # Debug tests
yarn test:e2e          # Run end-to-end tests
```

### Code Quality

```bash
yarn lint              # ESLint
yarn lint:fix          # ESLint with auto-fix
yarn format            # Prettier formatting
```

**Important Notes:**
- **ALWAYS use yarn**, never npm
- Set `DEPLOY_ENV` environment variable before running commands (local, development, sandbox, production)
- Docker method is recommended for consistency across platforms
- `yarn migration:generate` automatically runs `yarn build && yarn cp:env` before generating migrations

## Environment Configuration

The project uses a multi-environment setup with files in `environment/`:
- `base.env` - Base configuration shared across all environments
- `local.env` - Local development overrides
- `development.env` - Development environment
- `sandbox.env` - Sandbox environment  
- `production.env` - Production environment

Set `DEPLOY_ENV` to load the appropriate environment file:
```bash
export DEPLOY_ENV=local    # Uses local.env + base.env
export DEPLOY_ENV=development  # Uses development.env + base.env
```

### Required Environment Variables
- MongoDB connection settings (MONGODB)
- Sentry configuration for error monitoring
- Application port and other service configurations

## Request/Response Flow

1. **HTTP Request** → NestJS Controller (with validation decorators)
2. **Controller** → Service (business logic layer)  
3. **Service** → Schema/Model (data access via Mongoose)
4. **Database** → MongoDB operations
5. **Response** ← Formatted DTO back through the chain

### Error Handling Flow
1. **Exceptions** thrown in services/repositories
2. **Custom Error Classes** (`DuplicateEntityError`, `NotFoundEntityError`, etc.)
3. **HttpExceptionFilter** converts to appropriate HTTP status codes
4. **Sentry Integration** captures and tracks errors automatically

## Key Technical Details

### Core Components

#### Database Layer (Mongoose)
- **Schemas**: Define database schema with decorators (`@Schema`, `@Prop`)
- **Models**: Access data via injected models in services

#### Validation & Transformation
- **DTOs**: Request/response data transfer objects with validation
- **class-validator**: Decorative validation (`@IsString`, `@IsOptional`, etc.)
- **class-transformer**: Object transformation and serialization

#### Error Management
- **Custom Exceptions**: Domain-specific error classes in `shared/error/`
- **Global Filter**: `HttpExceptionFilter` provides consistent error responses  
- **Error Mapping**: `httpExceptionMap` converts internal errors to HTTP status codes

#### Monitoring & Observability
- **Sentry Integration**: Automatic error tracking and performance monitoring
- **Health Checks**: Core module provides `/health` endpoint via `@nestjs/terminus`
- **Swagger Documentation**: Auto-generated API docs from decorators

### Example Module Structure (Reference: users module)

This serves as a **template** for creating new modules. Study [src/users/](src/users/) for complete implementation:

#### Schema Pattern ([UserSchema.ts](src/users/schemas/UserSchema.ts))
```typescript
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ type: String, required: false })
  firstName: string;

  @Prop({ type: Number, default: 0 })
  version: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

#### Service Pattern ([UserService.ts](src/users/service/UserService.ts))
```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserPayloadDto): Promise<User> {
    try {
      const user = new this.userModel(dto);
      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new DuplicateEntityError('User already exists', 'User', error.code);
      }
      throw error;
    }
  }
}
```

#### Controller Pattern ([UserController.ts](src/users/controller/UserController.ts))
```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserDto })
  async create(@Body() dto: CreateUserPayloadDto): Promise<UserDto> {
    return this.userService.create(dto);
  }

  // RESTful endpoints with validation, documentation, pagination
}
```

## Creating New Projects from Template

### Starting a New Project

1. **Clone/Copy** this base project
2. **Update `package.json`**: Change name, description, version
3. **Review Existing Modules**: Study `users`, `auth`, and `sms-validation` as reference implementations
4. **Environment Setup**: Configure environment files for your deployment
5. **Database**: Update schema name, connection details
6. **Remove/Modify Example Data**: Adapt existing modules or create new ones based on your needs

### Adding a New Business Module

Follow the pattern established in existing modules ([users](src/users/), [auth](src/auth/), [sms-validation](src/sms-validation/)):

1. **Create Feature Branch**: `git checkout -b feat/module-name develop`
2. **Create Module Directory**: `src/[module-name]/` with subfolders: `controller/`, `service/`, `dto/`, `schemas/`, `interface/`
3. **Define Schema**: Create Mongoose schema in `schemas/[Entity]Schema.ts` with proper decorators
4. **Create DTOs**: Request/response objects in `dto/` with class-validator decorators
5. **Implement Service**: Business logic in `service/[Module]Service.ts` with proper error handling
6. **Create Controller**: REST endpoints in `controller/[Module]Controller.ts` with Swagger documentation
7. **Write Tests**: `service/[Module]Service.spec.ts` and `controller/[Module]Controller.spec.ts`
8. **Define Module**: NestJS module in `[Module]Module.ts` registering Mongoose schemas
9. **Register Module**: Import in [AppModule.ts](src/AppModule.ts)
10. **Create PR**: Push branch and create PR against `develop`

### Module Checklist

- [ ] Schema with proper decorators and relationships
- [ ] Service with CRUD operations and business logic
- [ ] Controller with validation, documentation, and error handling  
- [ ] DTOs for create, update, filter, and response
- [ ] Unit tests for service and controller
- [ ] Interface definitions if needed
- [ ] Update AppModule imports

## Sub-Agent Workflow

### Rules
- After a plan mode phase you should create a `.claude/sessions/context_session_{feature_name}.md` with the definition of the plan
- Before you do any work, MUST view files in `.claude/sessions/context_session_{feature_name}.md` file and `.claude/doc/{feature_name}/*` files to get the full context (feature_name being the id of the session we are operating, if file doesn't exist, then create one)
- `.claude/sessions/context_session_{feature_name}.md` should contain most of context of what we did, overall plan, and sub agents will continuously add context to the file
- After you finish the work, MUST update the `.claude/sessions/context_session_{feature_name}.md` file to make sure others can get full context of what you did
- After you finish each phase, MUST update the `.claude/sessions/context_session_{feature_name}.md` file to make sure others can get full context of what you did

### Claude Workflow Commands & Agents

This project uses a sophisticated Claude workflow system with specialized commands and agents. The complete workflow is documented in `.claude/WORKFLOW-SUMMARY.md`.

#### Available Commands:
- **`explore-plan <feature-description>`**: Feature planning & architecture design
- **`start-working-on-branch-new <branch-name>`**: Begin development on feature branch
- **`run-tests [scope]`**: Execute comprehensive testing
- **`analyze_bug`**: Bug analysis and resolution planning

**Workflow Notes:**
- **No GitHub issues required** - create feature branches directly from `develop`
- Branch naming: `feat/`, `fix/`, `refactor/`, `chore/`
- Always create PRs against `develop` branch
- **Always use yarn** for all package management and scripts

#### Specialized Agents:
- **`nestjs-backend-architect`**: NestJS module architecture, Clean Architecture, dependency injection
- **`laravel-backend-architect`**: Laravel architecture patterns (for hybrid projects)
- **`angular-frontend-developer`**: Angular frontend development (if needed)
- **`flutter-frontend-developer`**: Flutter mobile development (if needed)
- **`qa-criteria-validator`**: Final validation and testing feedback
- **`ui-ux-analyzer`**: UI/UX review and improvements

#### Workflow Integration:
1. **Planning Phase**: `explore-plan` creates `.claude/sessions/context_session_{feature_name}.md`
2. **Implementation**: Agents create documentation in `.claude/doc/{feature_name}/`
3. **Execution**: Follow the implementation plans created by specialized agents
4. **Testing**: Integrated TDD approach with >80% coverage requirement

Always follow the complete workflow documented in `.claude/WORKFLOW-SUMMARY.md` for consistent development practices.

## Claude Configuration Structure

The `.claude/` folder contains the complete workflow configuration:

```
.claude/
├── settings.json              # Claude permissions and MCP server config
├── WORKFLOW-SUMMARY.md        # Complete development workflow documentation
├── agents/                    # Specialized agent definitions
│   ├── nestjs-backend-architect.md
│   ├── laravel-backend-architect.md
│   ├── angular-frontend-developer.md
│   ├── flutter-frontend-developer.md
│   ├── qa-criteria-validator.md
│   └── ui-ux-analyzer.md
├── commands/                  # Workflow command definitions
│   ├── explore-plan.md
│   ├── create-new-gh-branch.md
│   ├── start-working-on-branch-new.md
│   ├── run-tests.md
│   ├── update-feedback.md
│   └── analyze_bug.md
├── sessions/                  # Active development session contexts
├── doc/                       # Agent-generated implementation plans
└── docs/                      # Additional documentation
```

### Key Configuration Notes:
- **MCP Servers Enabled**: `context7`, `sequentialthinking`, `playwright`, `shadcn`
- **Permissions**: Git operations, npm/yarn commands, file operations
- **Session Management**: Feature contexts stored in `sessions/`
- **Implementation Plans**: Agent outputs stored in `doc/{feature_name}/`
- **Hooks**: Automated notifications for workflow events

### NestJS-Specific Optimizations:
For this NestJS base template, consider:
- **`shadcn` MCP server**: May not be needed (UI components for React/Next.js)
- **`playwright` MCP server**: Useful for e2e testing if implementing browser testing
- **`context7`**: Essential for accessing NestJS documentation and patterns
- **`sequentialthinking`**: Valuable for complex architectural decisions

**Recommendation**: Keep current setup as base template supports multiple frontend technologies via specialized agents.

## Code Writing Standards

- **Simplicity First**: Prefer simple, clean, maintainable solutions over clever ones
- **ABOUTME Comments**: All files must start with 2-line comment with "ABOUTME: " prefix for greppability
  ```typescript
  // ABOUTME: This service handles user CRUD operations and business logic
  // ABOUTME: Includes transaction management for complex multi-entity operations
  ```
- **Minimal Changes**: Make smallest reasonable changes to achieve desired outcome
- **Style Matching**: Match existing code style/formatting within each file
- **Preserve Comments**: Never remove comments unless provably false
- **No Temporal Naming**: Avoid 'new', 'improved', 'enhanced', 'recently' in names/comments
- **Evergreen Documentation**: Comments describe code as it is, not its history
- **No Unrelated Changes**: Don't change whitespace or format code unrelated to your task

## Version Control

- Non-trivial edits must be tracked in git
- **Branch Workflow**:
  - Create feature branches from `develop`: `git checkout -b feat/feature-name develop`
  - Branch naming: `feat/`, `fix/`, `refactor/`, `chore/`
  - **No GitHub issues required** - create branches directly
  - Always create PRs against `develop` branch
- Commit frequently throughout development
- Never throw away implementations without explicit permission
- **Always use yarn** for all package operations

## Testing Requirements

**NO EXCEPTIONS POLICY**: All projects MUST have:
- Unit tests (Jest)
- Integration tests (Supertest)
- End-to-end tests
- Minimum 80% code coverage

The only way to skip tests: David EXPLICITLY states "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME."

### Test Execution
- Tests must comprehensively cover all functionality
- Test output must be pristine to pass
- Never ignore system/test output - logs contain critical information
- Use `yarn test:cov` to verify coverage requirements

## Architecture Compliance

### NestJS Best Practices

1. **Modular Architecture**: Each business domain gets its own module with clear boundaries
2. **Dependency Injection**: Use NestJS IoC container, inject dependencies via constructor
3. **Thin Controllers**: Controllers handle HTTP concerns, delegate business logic to services
4. **Service Layer**: Business logic and orchestration in services
5. **Repository Pattern**: Data access through Mongoose models
6. **DTO Validation**: Use class-validator for all input/output validation
7. **Error Handling**: Use custom exceptions with global exception filter
8. **Documentation**: Swagger decorators for all API endpoints

### Code Organization Rules

1. **Module Structure**: Follow the established pattern (controller/, service/, dto/, schemas/, interface/)
2. **Naming Conventions**:
   - PascalCase for classes, interfaces, enums, types
   - camelCase for methods, properties, variables
   - snake_case for database column names (mapped to camelCase in entities)
   - Folder names: singular, lowercase (e.g., `user/` not `users/`)
3. **Import Organization**: Group imports in order:
   ```typescript
   // 1. NestJS imports
   import { Injectable } from '@nestjs/common';
   import { InjectModel } from '@nestjs/mongoose';

   // 2. Third-party imports
   import { Model } from 'mongoose';

   // 3. Local imports (relative paths)
   import { User } from '../schemas/UserSchema';
   import { CreateUserPayloadDto } from '../dto/CreateUserPayloadDto';
   ```
4. **Type Safety**: Strong typing throughout, avoid `any` type (noImplicitAny is disabled for gradual adoption)
5. **Async/Await**: Use async/await for all asynchronous operations
6. **Database Transactions**: Wrap multi-operation database calls in transactions using DataSource
7. **Error Handling**: Always use custom error classes from [shared/error/](src/shared/error/)


## Code Writing

- YOU MUST ALWAYS address me as "David" in all communications.
- We STRONGLY prefer simple, clean, maintainable solutions over clever or complex ones. Readability and maintainability are PRIMARY CONCERNS, even at the cost of conciseness or performance.
- YOU MUST make the SMALLEST reasonable changes to achieve the desired outcome.
- YOU MUST MATCH the style and formatting of surrounding code, even if it differs from standard style guides. Consistency within a file trumps external standards.
- YOU MUST NEVER make code changes unrelated to your current task. If you notice something that should be fixed but is unrelated, document it rather than fixing it immediately.
- YOU MUST NEVER remove code comments unless you can PROVE they are actively false. Comments are important documentation and must be preserved.
- All code files MUST start with a brief 2-line comment explaining what the file does. Each line MUST start with "ABOUTME: " to make them easily greppable.
- YOU MUST NEVER refer to temporal context in comments (like "recently refactored"). Comments should be evergreen and describe the code as it is.
- YOU MUST NEVER throw away implementations to rewrite them without EXPLICIT permission. If you're considering this, YOU MUST STOP and ask first.
- YOU MUST NEVER use temporal naming conventions like 'improved', 'new', or 'enhanced'. All naming should be evergreen.
- YOU MUST NOT change whitespace unrelated to code you're modifying.

## Version Control

- For non-trivial edits, all changes MUST be tracked in git.
- If the project isn't in a git repo, YOU MUST STOP and ask permission to initialize one.
- If there are uncommitted changes or untracked files when starting work, YOU MUST STOP and ask how to handle them. Suggest committing existing work first.
- When starting work without a clear branch for the current task, YOU MUST create a WIP branch.
- YOU MUST commit frequently throughout the development process.


## Getting Help

- Always ask for clarification rather than making assumptions
- Stop and ask for help when stuck, especially when human input would be valuable
- If considering an exception to any rule, stop and get explicit permission from David first

## Test Patterns and Examples

### Service Test Pattern
Reference the existing `UserService.spec.ts` for mocking patterns:
```typescript
describe('UserService', () => {
  let service: UserService;
  let model: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  // Test cases covering all service methods
});
```

### Controller Test Pattern
Reference `UserController.spec.ts` for HTTP request/response testing with proper mocking.


## Common Patterns and Pitfalls

### Error Handling Pattern
Always use custom error classes from [src/shared/error/](src/shared/error/):
```typescript
// Good
if (error.code === 11000) {
  throw new DuplicateEntityError('Entity exists', 'Entity', error.code);
}
if (!entity) {
  throw new NotFoundEntityError('Entity not found', 'Entity');
}

// Bad - Never throw generic errors
throw new Error('Something went wrong');
```

// For operations involving multiple database writes, use Mongoose transactions if needed.

### Common Pitfalls to Avoid
- Never use `any` type - maintain strict TypeScript typing
- Don't create controllers without corresponding unit tests
- Avoid direct database queries - use models via `@InjectModel()`
- Don't implement business logic in controllers - keep them thin
- Always validate input DTOs with class-validator decorators
- Never commit without running `yarn test` and ensuring all tests pass
- Don't forget to add `@ApiTags()`, `@ApiOperation()`, and `@ApiResponse()` to all endpoints

## Compliance Check
Before submitting any work, verify that you have followed ALL guidelines above. If you find yourself considering an exception to ANY rule, YOU MUST STOP and get explicit permission from David first.