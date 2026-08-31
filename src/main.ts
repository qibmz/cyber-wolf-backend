import 'dotenv/config';
import helmet from 'helmet';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { ResponseInterceptor } from './utils/response.interceptor';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';
import { ObserveInstrument } from './observe/observe.setup';

async function bootstrap() {
  const observeEnabled = process.env.OBSERVE_ENABLED === 'true';
  const app = await NestFactory.create(
    AppModule,
    observeEnabled ? { instrument: ObserveInstrument } : undefined,
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigins = configService.getOrThrow('app.corsOrigins', {
    infer: true,
  });
  app.enableCors({
    origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResponseInterceptor wraps successful responses into { code, msg, data }
    new ResponseInterceptor(),
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(I18nService), {
      headerLanguage: configService.getOrThrow('app.headerLanguage', {
        infer: true,
      }),
      fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
        infer: true,
      }),
    }),
  );

  // OpenAPI Tag：name 用英文稳定标识（Orval 分组/文件名），description 用中文说明（Swagger UI 展示）
  const apiTags: { name: string; description: string }[] = [
    { name: 'home', description: '首页' },
    { name: 'auth', description: '认证' },
    { name: 'users', description: '用户' },
    { name: 'files', description: '文件' },
    { name: 'news', description: '资讯' },
    { name: 'markets', description: '行情' },
    { name: 'admin-news', description: '后台-资讯' },
    { name: 'admin-news-categories', description: '后台-资讯分类' },
  ];

  const documentBuilder = new DocumentBuilder()
    .setTitle('Cyber Wolf API')
    .setDescription('接口文档（成功响应经全局包装为 { code, msg, data }）')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    });

  for (const tag of apiTags) {
    documentBuilder.addTag(tag.name, tag.description);
  }

  const document = SwaggerModule.createDocument(app, documentBuilder.build());
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
