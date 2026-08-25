import { Module } from '@nestjs/common';
import { NewsCategoriesService } from './news-categories.service';
import { NewsCategoriesAdminController } from './news-categories-admin.controller';
import { RelationalNewsCategoryPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalNewsCategoryPersistenceModule],
  controllers: [NewsCategoriesAdminController],
  providers: [NewsCategoriesService],
  exports: [NewsCategoriesService, RelationalNewsCategoryPersistenceModule],
})
export class NewsCategoriesModule {}
