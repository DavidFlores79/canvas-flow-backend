
## Description

  

Wallet Service API

  

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
Supongamos que vas agregar un nuevo módulo para `productos`. Vas a generar una estructura de carpetas así:

    wallet-service/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── main.ts
    │   ├── app.module.ts
    │   ├── other-projects...
    │   └── product/
    │       ├── controller
    │          ├── ProductController.ts
    │       └── service
    │           └── UserService.ts
    │       └── entity
    │           └── User.ts
    │       └── UserModule.ts
La primera cosa que tienes que notar es que todas las carpetas están en `ingles` y `singular`. En este ejemplo, el archivo `entity/User.ts` es la entidad que representa la información que se almacenará en la base de datos. Este nuevo archivo será utilizado por `typeorm` para generar un archivo de migración que creará la respectiva tabla con los campos y tipos necesarios.

El siguiente comando generará un archivo de migración dentro de `/src/database/migrations` con todo lo necesario para almacenar el base de datos `entity/User.ts`. **NOTA:** No olvides incluir `DEPLOY_ENV` en los comandos siguientes.
```bash
$  DEPLOY_ENV=local yarn  migration:generate
```
Ejecuta la migración en base de datos, esto creará la(s) nueva(s) tabla(s) de todos los archivos dentro de la carpeta `entity`.
```bash
$  yarn  build //no olvides compilar el código siempre antes de ejecutar las migraciones
$  yarn  cp:env //copia los environment variables a la carpeta /dist
$  DEPLOY_ENV=local yarn  db:migrate
```  

## Resources
Check out a few resources that may come in handy when working with NestJS:

- Visit the [TypeORM Documentation](https://docs.nestjs.com) to learn more about the ORM.

- Visit [NestJS Database Documentation](https://docs.nestjs.com/techniques/database) to learn more about how NestJS works with database integration.