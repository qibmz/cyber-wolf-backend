import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsCategoryRepository } from '../news-category.repository';
import { NewsCategoryRelationalRepository } from './repositories/news-category.repository';
import { NewsCategoryEntity } from './entities/news-category.entity';
import { NewsArticleEntity } from '../../../../news-articles/infrastructure/persistence/relational/entities/news-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewsCategoryEntity, NewsArticleEntity])],
  providers: [
    {
      provide: NewsCategoryRepository,
      useClass: NewsCategoryRelationalRepository,
    },
  ],
  exports: [NewsCategoryRepository],
})
export class RelationalNewsCategoryPersistenceModule {}
