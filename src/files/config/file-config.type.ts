export enum FileDriver {
  LOCAL = 'local',
  S3 = 's3',
  S3_PRESIGNED = 's3-presigned',
}

export type FileConfig = {
  driver: FileDriver;
  accessKeyId?: string;
  secretAccessKey?: string;
  awsDefaultS3Bucket?: string;
  awsS3Region?: string;
  /** e.g. https://<account_id>.r2.cloudflarestorage.com */
  awsS3Endpoint?: string;
  /** Public CDN / custom domain for object URLs, e.g. https://img.example.com */
  awsS3PublicBaseUrl?: string;
  /** Object key prefix / folder, e.g. cyber-wolf (keeps keys apart from other apps) */
  awsS3KeyPrefix?: string;
  maxFileSize: number;
};
