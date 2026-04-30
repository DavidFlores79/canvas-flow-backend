export interface EnvironmentVariables {
  PORT: number;
  DEPLOY_ENV: string;
  MONGODB: string;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  JWT_ISSUER: string;
  JWT_PRIVATE_KEY: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_VERIFY_SID: string;
  SALT_ROUND: string;
}
