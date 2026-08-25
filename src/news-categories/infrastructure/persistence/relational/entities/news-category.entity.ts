import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'news_category',
})
export class NewsCategoryEntity extends EntityRelationalHelper {
  @Column({
    nullable: false,
    type: String,
  })
  name: string;

  @Index()
  @Column({
    nullable: false,
    type: 'int',
    default: 0,
  })
  sortOrder: number;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Index()
  @Column({
    nullable: true,
    type: Date,
  })
  deletedAt?: Date | null;
}
