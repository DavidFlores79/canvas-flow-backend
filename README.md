
## Description

  

Base project API

  

## Project Setup

### Option 1: Using Docker (Recommended)

```bash
# Start all services (API + PostgreSQL)
$ docker-compose up -d

# View logs
$ docker-compose logs -f

# Stop services
$ docker-compose down
```

The API will be available at `http://localhost:3000`

### Option 2: Local Development

**Prerequisites:**
- Node.js v22.x or higher
- PostgreSQL 16
- Yarn package manager

```bash
# Install dependencies
$ yarn install

# Make sure PostgreSQL is running locally
$ docker run -d -p 5432:5432 --name wallet-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wallet-service \
  postgres:16

# Set environment variable (Windows PowerShell)
$ $env:DEPLOY_ENV="local"

# Set environment variable (Linux/Mac)
$ export DEPLOY_ENV=local

# Run migrations
$ yarn db:migrate

# Start the application in watch mode
$ yarn run start:dev
```

## Compile and Run the Project

### Using Docker

```bash
# Build and start all services
$ docker-compose up -d

# Restart API after code changes
$ docker-compose restart base-project-nest

# View API logs
$ docker-compose logs -f base-project-nest

# Build production Docker image
$ docker build -t base-project-nest .
```

### Local Development

```bash
# development mode
$ yarn run start

# watch mode (hot reload)
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

  

## Run tests

  

```bash

# unit tests

$  yarn  run  test
  

# test coverage

$  yarn  run  test:cov

```

  

## Deployment

### Adding a New Module

To add a new business module, follow the pattern established in existing modules (`users`, `auth`, `sms-validation`). Here's an example folder structure:

    base_project/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── main.ts
    │   ├── AppModule.ts
    │   ├── users/        # Reference implementation
    │   ├── auth/         # Reference implementation
    │   ├── sms-validation/  # Reference implementation
    │   └── [your-module]/   # Your new module
    │       ├── controller/
    │       │   ├── [Module]Controller.ts
    │       │   └── [Module]Controller.spec.ts
    │       ├── service/
    │       │   ├── [Module]Service.ts
    │       │   └── [Module]Service.spec.ts
    │       ├── entity/
    │       │   └── [Entity].ts
    │       ├── dto/
    │       ├── interface/
    │       └── [Module]Module.ts
    
**Important notes:**
- All folders should be in **English** and **singular** form
- The `entity/[Entity].ts` file defines the database schema
- TypeORM uses entities to generate database migrations automatically

### Generate and Run Database Migrations

#### Using Docker (Recommended)

This project uses Docker for database operations to ensure consistency across environments:

```bash
# 1. Generate migration (creates migration file from entity changes)
$ docker exec -it base-project-nest sh -c "DEPLOY_ENV=local yarn migration:generate"

# 2. Run migration (applies changes to database)
$ docker exec -it base-project-nest sh -c "DEPLOY_ENV=local yarn db:migrate"

# 3. Revert last migration (if needed)
$ docker exec -it base-project-nest sh -c "DEPLOY_ENV=local yarn migration:revert"
```

#### Local Development (Without Docker)

If you're running the project locally without Docker:

```bash
# Windows PowerShell
$ $env:DEPLOY_ENV="local"
$ yarn migration:generate
$ yarn db:migrate

# Linux/Mac
$ export DEPLOY_ENV=local
$ yarn migration:generate
$ yarn db:migrate

# Or set inline (Linux/Mac)
$ DEPLOY_ENV=local yarn migration:generate
$ DEPLOY_ENV=local yarn db:migrate
```

**Important Notes:** 
- Always set `DEPLOY_ENV` environment variable (local, development, production, sandbox)
- Migrations are generated automatically from your TypeORM entities
- The migration files are created in `src/database/migrations/`
- Build is automatically included in the migration:generate command
- Docker method is preferred to avoid cross-platform command issues  

## Resources
Check out a few resources that may come in handy when working with NestJS:

- Visit the [TypeORM Documentation](https://docs.nestjs.com) to learn more about the ORM.

- Visit [NestJS Database Documentation](https://docs.nestjs.com/techniques/database) to learn more about how NestJS works with database integration.
