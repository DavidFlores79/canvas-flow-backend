# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **base NestJS project template** designed to serve as a foundation for new API projects. It demonstrates best practices for NestJS architecture, database integration, error handling, and testing patterns. The `investment-products` module serves as a **reference example** showing how to structure new business modules and will be removed when creating actual projects from this template.

## Architecture

### Tech Stack
- **Framework**: NestJS with TypeScript
- **Architecture**: Modular NestJS with layered structure
- **Database**: PostgreSQL with TypeORM
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
    DatabaseModule.ts  # Database module setup
    data-source.ts     # TypeORM data source
    migrations/        # Database migrations

  shared/              # Shared utilities across modules
    decorator/         # Custom decorators
    dto/               # Common DTOs (pagination, etc.)
    error/             # Custom error classes
    interface/         # Shared interfaces

  [module-name]/       # Business modules (e.g., investment-products)
    [Module]Module.ts  # Module definition
    controller/        # REST controllers
    dto/               # Module-specific DTOs
    entity/            # TypeORM entities
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

### Module Pattern (Reference: investment-products)

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
  entity/              # TypeORM entities
    [Entity].ts
  interface/           # TypeScript interfaces
    [Entity].ts
```

## Development Commands

### Running the Application

```bash
yarn start:dev        # Development server with hot reload
yarn start:debug      # Debug mode with hot reload
yarn build            # Production build
yarn start:prod       # Production server
```

### Database Operations

```bash
# Database migrations
yarn migration:generate   # Generate new migration
yarn db:migrate          # Run pending migrations
yarn migration:revert    # Revert last migration

# Docker PostgreSQL (for development)
docker run -d -p 5432:5432 postgres
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

**Always use yarn instead of npm.**

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
- Database connection settings (DB_HOST, DB_PORT, DB_USERNAME, etc.)
- Sentry configuration for error monitoring
- Application port and other service configurations

## Request/Response Flow

1. **HTTP Request** → NestJS Controller (with validation decorators)
2. **Controller** → Service (business logic layer)  
3. **Service** → Repository/Entity (data access via TypeORM)
4. **Database** → PostgreSQL operations
5. **Response** ← Formatted DTO back through the chain

### Error Handling Flow
1. **Exceptions** thrown in services/repositories
2. **Custom Error Classes** (`DuplicateEntityError`, `NotFoundEntityError`, etc.)
3. **HttpExceptionFilter** converts to appropriate HTTP status codes
4. **Sentry Integration** captures and tracks errors automatically

## Key Technical Details

### Core Components

#### Database Layer (TypeORM)
- **Entities**: Define database schema with decorators (`@Entity`, `@Column`, etc.)
- **Migrations**: Version-controlled database changes in `src/database/migrations/`
- **Data Source**: Centralized database configuration in `data-source.ts`

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

### Example Module Structure (investment-products)

This serves as a **template** for creating new modules:

#### Entity Pattern
```typescript
@Entity('investment_products')
export class InvestmentProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;
  
  // Decimal handling, versioning, timestamps, etc.
}
```

#### Service Pattern  
```typescript
@Injectable()
export class InvestmentProductService {
  constructor(
    @InjectRepository(InvestmentProduct)
    private repository: Repository<InvestmentProduct>,
  ) {}
  
  // CRUD operations with proper error handling
}
```

#### Controller Pattern
```typescript
@Controller('investment-products')
@ApiTags('Investment Products')
export class InvestmentProductController {
  // RESTful endpoints with validation, documentation
}
```

## Creating New Projects from Template

### Starting a New Project

1. **Clone/Copy** this base project
2. **Update `package.json`**: Change name, description, version
3. **Remove Example Module**: Delete `investment-products/` directory
4. **Update AppModule**: Remove InvestmentProductModule import
5. **Environment Setup**: Configure environment files for your deployment
6. **Database**: Update schema name, connection details

### Adding a New Business Module

Follow the `investment-products` pattern:

1. **Create Module Directory**: `src/[module-name]/`
2. **Define Entity**: Create TypeORM entity in `entity/[Entity].ts`
3. **Create DTOs**: Request/response objects in `dto/`
4. **Implement Service**: Business logic in `service/[Module]Service.ts`
5. **Create Controller**: REST endpoints in `controller/[Module]Controller.ts`
6. **Define Module**: NestJS module in `[Module]Module.ts`
7. **Register Module**: Import in `AppModule.ts`
8. **Generate Migration**: `yarn migration:generate`

### Module Checklist

- [ ] Entity with proper decorators and relationships
- [ ] Service with CRUD operations and business logic
- [ ] Controller with validation, documentation, and error handling  
- [ ] DTOs for create, update, filter, and response
- [ ] Unit tests for service and controller
- [ ] Interface definitions if needed
- [ ] Update AppModule imports
- [ ] Generate and run database migration

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
- **`create-new-gh-branch <feature-description>`**: GitHub issue & branch creation
- **`start-working-on-branch-new <branch-name>`**: Begin development on feature branch
- **`run-tests [scope]`**: Execute comprehensive testing
- **`update-feedback`**: Continuous integration feedback loop
- **`analyze_bug`**: Bug analysis and resolution planning

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
- **ABOUTME Comments**: All files must start with 2-line comment with "ABOUTME: " prefix
- **Minimal Changes**: Make smallest reasonable changes to achieve desired outcome
- **Style Matching**: Match existing code style/formatting within each file
- **Preserve Comments**: Never remove comments unless provably false
- **No Temporal Naming**: Avoid 'new', 'improved', 'enhanced', 'recently' in names/comments
- **Evergreen Documentation**: Comments describe code as it is, not its history

## Version Control

- Non-trivial edits must be tracked in git
- Create WIP branches for new work
- Commit frequently throughout development
- Never throw away implementations without explicit permission

## Testing Requirements

**NO EXCEPTIONS POLICY**: All projects MUST have:
- Unit tests

The only way to skip tests: Fran EXPLICITLY states "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME."

- Tests must comprehensively cover all functionality
- Test output must be pristine to pass
- Never ignore system/test output - logs contain critical information

## Architecture Compliance

### NestJS Best Practices

1. **Modular Architecture**: Each business domain gets its own module with clear boundaries
2. **Dependency Injection**: Use NestJS IoC container, inject dependencies via constructor
3. **Thin Controllers**: Controllers handle HTTP concerns, delegate business logic to services
4. **Service Layer**: Business logic and orchestration in services
5. **Repository Pattern**: Data access through TypeORM repositories
6. **DTO Validation**: Use class-validator for all input/output validation
7. **Error Handling**: Use custom exceptions with global exception filter
8. **Documentation**: Swagger decorators for all API endpoints

### Code Organization Rules

1. **Module Structure**: Follow the established pattern (controller/, service/, dto/, entity/, interface/)
2. **Naming Conventions**: PascalCase for classes, camelCase for methods/properties
3. **Import Organization**: Group imports (NestJS, third-party, local)
4. **Type Safety**: Strong typing throughout, avoid `any` type
5. **Async/Await**: Use async/await for all asynchronous operations
6. **Database Transactions**: Wrap multi-operation database calls in transactions


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

## Testing

- Tests MUST comprehensively cover ALL implemented functionality. 
- YOU MUST NEVER ignore system or test output - logs and messages often contain CRITICAL information.
- Test output MUST BE PRISTINE TO PASS.
- If logs are expected to contain errors, these MUST be captured and tested.
- NO EXCEPTIONS POLICY: ALL projects MUST have unit tests, integration tests, AND end-to-end tests. The only way to skip any test type is if David EXPLICITLY states: "I AUTHORIZE YOU TO SKIP WRITING TESTS THIS TIME."


## Compliance Check
Before submitting any work, verify that you have followed ALL guidelines above. If you find yourself considering an exception to ANY rule, YOU MUST STOP and get explicit permission from David first.