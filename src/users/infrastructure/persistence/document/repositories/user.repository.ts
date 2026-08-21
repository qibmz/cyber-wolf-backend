import { Injectable } from '@nestjs/common';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserSchemaClass } from '../entities/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { PaginatedResult } from '../../../../../utils/types/paginated-result.type';

@Injectable()
export class UsersDocumentRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly usersModel: Model<UserSchemaClass>,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    const createdUser = new this.usersModel(persistenceModel);
    const userObject = await createdUser.save();
    return UserMapper.toDomain(userObject);
  }

  async findPage({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<PaginatedResult<User>> {
    const where: QueryFilter<UserSchemaClass> = {};
    if (filterOptions?.roles?.length) {
      where['role._id'] = {
        $in: filterOptions.roles.map((role) => role.id.toString()),
      };
    }

    const sort = sortOptions?.length
      ? sortOptions.reduce(
          (accumulator, sortOption) => ({
            ...accumulator,
            [sortOption.orderBy === 'id' ? '_id' : sortOption.orderBy]:
              sortOption.order.toUpperCase() === 'ASC' ? 1 : -1,
          }),
          {},
        )
      : { createdAt: -1 };

    const [userObjects, total] = await Promise.all([
      this.usersModel
        .find(where)
        .sort(sort)
        .skip((paginationOptions.page - 1) * paginationOptions.limit)
        .limit(paginationOptions.limit),
      this.usersModel.countDocuments(where),
    ]);

    return {
      data: userObjects.map((userObject) => UserMapper.toDomain(userObject)),
      total,
      paginationOptions,
    };
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    if (!Types.ObjectId.isValid(String(id))) {
      return null;
    }

    const userObject = await this.usersModel.findById(id);
    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const userObjects = await this.usersModel.find({
      _id: { $in: ids.map((id) => id.toString()) },
    });
    return userObjects.map((userObject) => UserMapper.toDomain(userObject));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    const userObject = await this.usersModel.findOne({ email });
    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    if (!socialId || !provider) return null;

    const userObject = await this.usersModel.findOne({
      socialId,
      provider,
    });

    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User | null> {
    const clonedPayload = { ...payload };
    delete clonedPayload.id;

    const filter = { _id: id.toString() };
    const user = await this.usersModel.findOne(filter);

    if (!user) {
      return null;
    }

    const userObject = await this.usersModel.findOneAndUpdate(
      filter,
      UserMapper.toPersistence({
        ...UserMapper.toDomain(user),
        ...clonedPayload,
      }),
      { new: true },
    );

    return userObject ? UserMapper.toDomain(userObject) : null;
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersModel.deleteOne({
      _id: id.toString(),
    });
  }
}
