import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from './env.js';

const s3 = new S3Client({
  endpoint: env.s3Endpoint,
  forcePathStyle: true,
  region: env.s3Region,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
});

export async function createPresignedUploadUrl({
  folder,
  filename,
  contentType,
}: {
  folder: string;
  filename: string;
  contentType: string;
}) {
  const normalizedFolder = folder.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const normalizedName = filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const key = `${normalizedFolder}/${Date.now()}-${normalizedName}`;

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

  return {
    key,
    uploadUrl,
    method: 'PUT' as const,
    expiresIn: 300,
  };
}
