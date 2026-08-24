import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { FileConfig } from '../../config/file-config.type';

export function createFileS3Client(fileConfig: FileConfig): S3Client {
  const config: S3ClientConfig = {
    region: fileConfig.awsS3Region || 'auto',
    credentials: {
      accessKeyId: fileConfig.accessKeyId ?? '',
      secretAccessKey: fileConfig.secretAccessKey ?? '',
    },
    // R2 / browser-compatible: avoid flexible checksums on signed requests
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  };

  if (fileConfig.awsS3Endpoint) {
    config.endpoint = fileConfig.awsS3Endpoint;
    // R2 requires path-style: https://<account>.r2.cloudflarestorage.com/<bucket>/...
    config.forcePathStyle = true;
  }

  return new S3Client(config);
}

export function buildObjectKey(
  fileConfig: FileConfig,
  fileNameOrExt: string,
): string {
  const prefix = (fileConfig.awsS3KeyPrefix ?? '').replace(/^\/+|\/+$/g, '');
  const key = prefix ? `${prefix}/${fileNameOrExt}` : fileNameOrExt;
  return key.replace(/\/+/g, '/');
}

export function publicUrlForKey(
  fileConfig: FileConfig,
  key: string,
): string | null {
  const base = fileConfig.awsS3PublicBaseUrl?.replace(/\/$/, '');
  if (!base) {
    return null;
  }
  return `${base}/${key.replace(/^\//, '')}`;
}
