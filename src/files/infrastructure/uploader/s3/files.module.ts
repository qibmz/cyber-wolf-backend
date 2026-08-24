import {
  HttpStatus,
  Module,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilesS3Controller } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import multerS3 from 'multer-s3';

import { FilesS3Service } from './files.service';

import { RelationalFilePersistenceModule } from '../../persistence/relational/relational-persistence.module';
import { AllConfigType } from '../../../../config/config.type';
import { buildObjectKey, createFileS3Client } from '../s3-client.factory';
import { FileConfig } from '../../../config/file-config.type';

@Module({
  imports: [
    RelationalFilePersistenceModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const fileCfg = {
          accessKeyId: configService.getOrThrow('file.accessKeyId', {
            infer: true,
          }),
          secretAccessKey: configService.getOrThrow('file.secretAccessKey', {
            infer: true,
          }),
          awsS3Region: configService.get('file.awsS3Region', { infer: true }),
          awsS3Endpoint: configService.get('file.awsS3Endpoint', {
            infer: true,
          }),
          awsS3KeyPrefix: configService.get('file.awsS3KeyPrefix', {
            infer: true,
          }),
        } as FileConfig;

        const s3 = createFileS3Client(fileCfg);

        return {
          fileFilter: (request, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
              return callback(
                new UnprocessableEntityException({
                  status: HttpStatus.UNPROCESSABLE_ENTITY,
                  errors: {
                    file: `cantUploadFileType`,
                  },
                }),
                false,
              );
            }

            callback(null, true);
          },
          storage: multerS3({
            s3: s3,
            bucket: configService.getOrThrow('file.awsDefaultS3Bucket', {
              infer: true,
            }),
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (request, file, callback) => {
              const name = `${randomStringGenerator()}.${file.originalname
                .split('.')
                .pop()
                ?.toLowerCase()}`;
              callback(null, buildObjectKey(fileCfg, name));
            },
          }),
          limits: {
            fileSize: configService.get('file.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [FilesS3Controller],
  providers: [FilesS3Service],
  exports: [FilesS3Service],
})
export class FilesS3Module {}
