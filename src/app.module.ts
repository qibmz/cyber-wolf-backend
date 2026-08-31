import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import googleConfig from './auth-google/config/google.config';
import walletConfig from './auth-wallet/config/wallet.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { AuthWalletModule } from './auth-wallet/auth-wallet.module';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NewsArticlesModule } from './news-articles/news-articles.module';
import { NewsCategoriesModule } from './news-categories/news-categories.module';
import { MarketsModule } from './markets/markets.module';
import marketsConfig from './markets/config/markets.config';
import observeConfig from './observe/config/observe.config';
import { ObserveModule } from './observe/observe.setup';

const observeImports =
  process.env.OBSERVE_ENABLED === 'true'
    ? [
        ObserveModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService<AllConfigType>) => ({
            appKey: configService.getOrThrow('observe.appKey', { infer: true }),
            appSecret: configService.getOrThrow('observe.appSecret', {
              infer: true,
            }),
            serviceId: configService.getOrThrow('observe.serviceId', {
              infer: true,
            }),
            serviceVersion: configService.get('observe.serviceVersion', {
              infer: true,
            }),
            tracesSampleRate: configService.getOrThrow(
              'observe.tracesSampleRate',
              { infer: true },
            ),
          }),
        }),
      ]
    : [];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NewsCategoriesModule,
    NewsArticlesModule,
    MarketsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        googleConfig,
        walletConfig,
        marketsConfig,
        observeConfig,
      ],
      envFilePath: ['.env'],
    }),
    ...observeImports,
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    AuthGoogleModule,
    AuthWalletModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
  ],
})
export class AppModule {}
