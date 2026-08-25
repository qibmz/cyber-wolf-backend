import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { NewsArticlesService } from './news-articles.service';
import { NewsArticlesController } from './news-articles.controller';
import { NewsArticlesAdminController } from './news-articles-admin.controller';
import { RelationalNewsArticlePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { NewsCategoriesModule } from '../news-categories/news-categories.module';

@Module({
  imports: [RelationalNewsArticlePersistenceModule, NewsCategoriesModule],
  controllers: [NewsArticlesController, NewsArticlesAdminController],
  providers: [NewsArticlesService],
  exports: [NewsArticlesService, RelationalNewsArticlePersistenceModule],
})
export class NewsArticlesModule {}
