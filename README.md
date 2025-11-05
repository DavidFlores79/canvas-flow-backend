
## Description

  

Base project API

  

## Install PostgreSQL

If you are using docker just run:

```bash

$  docker  run  -d  -p  5432:5432  postgres

```

This command will install PostgreSQL and expose the 5432 port.

  

## Project setup

  

```bash

$  yarn  install

```

  

## Compile and run the project

  

```bash

# development

$  yarn  run  start

  

# watch mode

$  yarn  run  start:dev

  

# production mode

$  yarn  run  start:prod

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

This project uses Docker for database operations. **Always run migrations inside Docker containers:**

```bash
# 1. Generate migration (creates migration file from entity changes)
$ docker exec -it base-project-nest sh -c "DEPLOY_ENV=local yarn migration:generate"

# 2. Run migration (applies changes to database)
$ docker exec -it base-project-nest sh -c "DEPLOY_ENV=local yarn db:migrate"
```

**Important:** 
- Always set `DEPLOY_ENV` environment variable (local, development, production)
- Migrations are generated automatically from your TypeORM entities
- The migration files are created in `/src/database/migrations/`
- Build is automatically included in the migration:generate command  

## Resources
Check out a few resources that may come in handy when working with NestJS:

- Visit the [TypeORM Documentation](https://docs.nestjs.com) to learn more about the ORM.

- Visit [NestJS Database Documentation](https://docs.nestjs.com/techniques/database) to learn more about how NestJS works with database integration.
