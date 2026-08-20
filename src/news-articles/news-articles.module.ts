import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { NewsArticlesService } from './news-articles.service';
import { NewsArticlesController } from './news-articles.controller';
import { RelationalNewsArticlePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import databaseConfig from '../database/config/database.config';
import { DatabaseConfig } from '../database/config/database-config.type';
import { DocumentNewsArticlePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentNewsArticlePersistenceModule
  : RelationalNewsArticlePersistenceModule;

@Module({
  imports: [
    // do not remove this comment
    infrastructurePersistenceModule,
  ],
  controllers: [NewsArticlesController],
  providers: [NewsArticlesService],
  exports: [NewsArticlesService, infrastructurePersistenceModule],
})
export class NewsArticlesModule {}
