# canvas-flow-backend

NestJS REST API backed by **MongoDB** (Mongoose).

## Project Setup

### Prerequisites

- Node.js v22.x or higher
- Yarn package manager
- A MongoDB Atlas cluster (or local MongoDB instance)

### Local Development

```bash
# Install dependencies
$ yarn install

# Configure environment — edit environment/local.env and set:
# MONGODB=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority

# Start in watch mode (DEPLOY_ENV is set automatically)
$ yarn start:dev
```

The API will be available at `http://localhost:3000`.

## Compile and Run

```bash
# development watch mode
$ yarn start:dev

# production
$ yarn start:prod
```

## Run Tests

```bash
# unit tests
$ yarn test

# test coverage
$ yarn test:cov
```

## Project Structure

```
src/
├── AppModule.ts
├── main.ts
├── config/               # Environment variable types
├── database/             # DatabaseModule (MongooseModule config)
├── core/                 # Health-check & info endpoints
├── auth/                 # Authentication (sign-up, sign-in, JWT, recover password)
├── users/                # User CRUD
│   ├── controller/
│   ├── service/
│   ├── schemas/          # Mongoose schemas (UserSchema.ts, AddressSchema.ts)
│   ├── dto/
│   └── UserModule.ts
└── sms-validation/       # SMS OTP via Twilio
    ├── controller/
    ├── service/
    ├── schemas/          # SmsValidationSchema.ts
    ├── dto/
    └── SmsValidationModule.ts
```

### Adding a New Module

Follow the pattern of existing modules. Each module folder contains:

```
[your-module]/
├── controller/
│   ├── [Module]Controller.ts
│   └── [Module]Controller.spec.ts
├── service/
│   ├── [Module]Service.ts
│   └── [Module]Service.spec.ts
├── schemas/
│   └── [Entity]Schema.ts        # Mongoose @Schema class
├── dto/
└── [Module]Module.ts
```

**Conventions:**

- Folder names: **English**, **singular**, kebab-case
- Schema files: `[Entity]Schema.ts` (e.g. `UserSchema.ts`)
- Schema constant exported at bottom: `export { UserSchema }`
- Document type: `export type UserDocument = HydratedDocument<User>`

## Environment Variables

All env files live in `environment/`. The active file is selected by `DEPLOY_ENV`:

| Variable | Description |
|---|---|
| `MONGODB` | Full MongoDB connection URI |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRY` | Token expiry (e.g. `30m`) |
| `JWT_ISSUER` | JWT issuer string |
| `JWT_PRIVATE_KEY` | JWT private key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (SMS) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (SMS) |
| `TWILIO_VERIFY_SID` | Twilio Verify service SID |
| `SALT_ROUND` | bcrypt salt rounds |

> `DEPLOY_ENV` is automatically set to `local` by the `start` / `start:dev` npm scripts.

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [NestJS + Mongoose](https://docs.nestjs.com/techniques/mongodb)
