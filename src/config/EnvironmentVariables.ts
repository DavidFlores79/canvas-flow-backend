export interface EnvironmentVariables {
  PORT: number;
  DEPLOY_ENV: string;
  MONGODB: string;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  JWT_ISSUER: string;
  JWT_PRIVATE_KEY: string;
  JWT_REFRESH_PRIVATE_KEY?: string;
  JWT_REFRESH_EXPIRY?: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_VERIFY_SID: string;
  SALT_ROUND: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  LEONARDO_API_KEY: string;
  LEONARDO_API_BASE_URL: string;
  REMOVE_BG_API_KEY: string;
}
