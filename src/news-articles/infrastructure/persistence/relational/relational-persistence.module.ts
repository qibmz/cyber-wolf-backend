import { Module } from '@nestjs/common';
import { NewsArticleRepository } from '../news-article.repository';
import { NewsArticleRelationalRepository } from './repositories/news-article.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsArticleEntity } from './entities/news-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsArticleEntity])],
  providers: [
    {
      provide: NewsArticleRepository,
      useClass: NewsArticleRelationalRepository,
    },
  ],
  exports: [NewsArticleRepository],
})
export class RelationalNewsArticlePersistenceModule {}
