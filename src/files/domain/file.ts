import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';
import {
  createFileS3Client,
  publicUrlForKey,
} from '../infrastructure/uploader/s3-client.factory';

export class FileType {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Allow()
  id: string;

  @ApiProperty({
    type: String,
    example: 'https://example.com/path/to/file.jpg',
  })
  @Transform(
    ({ value }) => {
      const cfg = fileConfig() as FileConfig;

      if (cfg.driver === FileDriver.LOCAL) {
        return (appConfig() as AppConfig).backendDomain + value;
      }

      if ([FileDriver.S3_PRESIGNED, FileDriver.S3].includes(cfg.driver)) {
        const publicUrl = publicUrlForKey(cfg, value);
        if (publicUrl) {
          return publicUrl;
        }

        const s3 = createFileS3Client(cfg);
        const command = new GetObjectCommand({
          Bucket: cfg.awsDefaultS3Bucket ?? '',
          Key: value,
        });

        return getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      return value;
    },
    {
      toPlainOnly: true,
    },
  )
  path: string;
}
