import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { NewsArticlesService } from './news-articles.service';
import { NewsArticlesController } from './news-articles.controller';
import { RelationalNewsArticlePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalNewsArticlePersistenceModule,
  ],
  controllers: [NewsArticlesController],
  providers: [NewsArticlesService],
  exports: [NewsArticlesService, RelationalNewsArticlePersistenceModule],
})
export class NewsArticlesModule {}
