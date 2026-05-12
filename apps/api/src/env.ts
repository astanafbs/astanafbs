import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3000),
  host: process.env.API_HOST ?? '0.0.0.0',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://fbs:fbs_password@localhost:5433/fbs_astana',
  allowDevAuth: process.env.ALLOW_DEV_AUTH !== 'false',
  adminApiToken: process.env.ADMIN_API_TOKEN ?? 'dev-admin-token',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  s3Endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? 'fbsminio',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? 'fbsminio123',
  s3Bucket: process.env.S3_BUCKET ?? process.env.MINIO_BUCKET ?? 'fbs-astana',
};
