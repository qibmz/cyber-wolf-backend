import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { now, HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type NewsArticleSchemaDocument =
  HydratedDocument<NewsArticleSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class NewsArticleSchemaClass extends EntityDocumentHelper {
  @Prop({
    type: String,
  })
  coverColor: string;

  @Prop({
    type: String,
  })
  sourceName: string;

  @Prop({
    type: String,
  })
  sourceId: string;

  @Prop({
    type: Date,
    index: true,
  })
  publishedAt: Date;

  @Prop({
    type: String,
  })
  coverImage?: string;

  @Prop({
    type: String,
    index: true,
  })
  category: string;

  @Prop({
    type: String,
    unique: true,
  })
  url: string;

  @Prop({
    type: String,
  })
  summary: string;

  @Prop({
    type: String,
  })
  title: string;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const NewsArticleSchema = SchemaFactory.createForClass(
  NewsArticleSchemaClass,
);
