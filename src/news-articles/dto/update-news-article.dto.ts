// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateNewsArticleDto } from './create-news-article.dto';

export class UpdateNewsArticleDto extends PartialType(CreateNewsArticleDto) {}
