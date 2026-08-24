import { registerAs } from '@nestjs/config';

import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { FileDriver, FileConfig } from './file-config.type';

function isS3Driver(envValues: Record<string, unknown>): boolean {
  return [FileDriver.S3, FileDriver.S3_PRESIGNED].includes(
    envValues.FILE_DRIVER as FileDriver,
  );
}

function hasS3Credentials(envValues: Record<string, unknown>): boolean {
  return Boolean(
    (envValues.ACCESS_KEY_ID || envValues.R2_ACCESS_KEY_ID) &&
    (envValues.SECRET_ACCESS_KEY || envValues.R2_SECRET_ACCESS_KEY) &&
    (envValues.AWS_DEFAULT_S3_BUCKET || envValues.R2_BUCKET_NAME),
  );
}

class EnvironmentVariablesValidator {
  @IsEnum(FileDriver)
  FILE_DRIVER: FileDriver;

  @ValidateIf(
    (envValues) => isS3Driver(envValues) && !envValues.R2_ACCESS_KEY_ID,
  )
  @IsString()
  ACCESS_KEY_ID: string;

  @ValidateIf((envValues) => isS3Driver(envValues) && !envValues.ACCESS_KEY_ID)
  @IsString()
  R2_ACCESS_KEY_ID: string;

  @ValidateIf(
    (envValues) => isS3Driver(envValues) && !envValues.R2_SECRET_ACCESS_KEY,
  )
  @IsString()
  SECRET_ACCESS_KEY: string;

  @ValidateIf(
    (envValues) => isS3Driver(envValues) && !envValues.SECRET_ACCESS_KEY,
  )
  @IsString()
  R2_SECRET_ACCESS_KEY: string;

  @ValidateIf((envValues) => isS3Driver(envValues) && !envValues.R2_BUCKET_NAME)
  @IsString()
  AWS_DEFAULT_S3_BUCKET: string;

  @ValidateIf(
    (envValues) => isS3Driver(envValues) && !envValues.AWS_DEFAULT_S3_BUCKET,
  )
  @IsString()
  R2_BUCKET_NAME: string;

  @ValidateIf((envValues) => isS3Driver(envValues))
  @IsOptional()
  @IsString()
  AWS_S3_REGION?: string;

  @ValidateIf((envValues) => isS3Driver(envValues))
  @IsOptional()
  @IsString()
  AWS_S3_ENDPOINT?: string;

  @ValidateIf((envValues) => isS3Driver(envValues))
  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  AWS_S3_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  R2_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  AWS_S3_KEY_PREFIX?: string;

  @IsOptional()
  @IsString()
  R2_KEY_PREFIX?: string;
}

function resolveS3Endpoint(env: NodeJS.ProcessEnv): string | undefined {
  if (env.AWS_S3_ENDPOINT) {
    return env.AWS_S3_ENDPOINT.replace(/\/$/, '');
  }
  if (env.R2_ACCOUNT_ID) {
    return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  return undefined;
}

export default registerAs<FileConfig>('file', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  if (
    isS3Driver(process.env as Record<string, unknown>) &&
    !hasS3Credentials(process.env as Record<string, unknown>)
  ) {
    throw new Error(
      'S3/R2 credentials missing: set ACCESS_KEY_ID/SECRET_ACCESS_KEY/AWS_DEFAULT_S3_BUCKET or R2_* equivalents',
    );
  }

  const accessKeyId = process.env.ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const awsDefaultS3Bucket =
    process.env.AWS_DEFAULT_S3_BUCKET || process.env.R2_BUCKET_NAME;
  const awsS3PublicBaseUrl = (
    process.env.AWS_S3_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_BASE_URL ||
    ''
  ).replace(/\/$/, '');

  return {
    driver:
      (process.env.FILE_DRIVER as FileDriver | undefined) ?? FileDriver.LOCAL,
    accessKeyId,
    secretAccessKey,
    awsDefaultS3Bucket,
    awsS3Region: process.env.AWS_S3_REGION || 'auto',
    awsS3Endpoint: resolveS3Endpoint(process.env),
    awsS3PublicBaseUrl: awsS3PublicBaseUrl || undefined,
    awsS3KeyPrefix: (
      process.env.AWS_S3_KEY_PREFIX ||
      process.env.R2_KEY_PREFIX ||
      'cyber-wolf'
    ).replace(/^\/+|\/+$/g, ''),
    maxFileSize: 5242880, // 5mb
  };
});
