import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'news_article',
})
export class NewsArticleEntity extends EntityRelationalHelper {
  @Column({
    nullable: false,
    type: String,
  })
  coverColor: string;

  @Column({
    nullable: false,
    type: String,
  })
  sourceName: string;

  @Column({
    nullable: false,
    type: String,
  })
  sourceId: string;

  @Index()
  @Column({
    nullable: false,
    type: Date,
  })
  publishedAt: Date;

  @Column({
    nullable: true,
    type: String,
  })
  coverImage?: string;

  @Index()
  @Column({
    nullable: false,
    type: String,
  })
  category: string;

  @Column({
    nullable: false,
    type: String,
    unique: true,
  })
  url: string;

  @Column({
    nullable: false,
    type: String,
  })
  summary: string;

  @Column({
    nullable: false,
    type: String,
  })
  title: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
