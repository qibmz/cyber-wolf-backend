import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NewsArticleSchema,
  NewsArticleSchemaClass,
} from './entities/news-article.schema';
import { NewsArticleRepository } from '../news-article.repository';
import { NewsArticleDocumentRepository } from './repositories/news-article.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsArticleSchemaClass.name, schema: NewsArticleSchema },
    ]),
  ],
  providers: [
    {
      provide: NewsArticleRepository,
      useClass: NewsArticleDocumentRepository,
    },
  ],
  exports: [NewsArticleRepository],
})
export class DocumentNewsArticlePersistenceModule {}
