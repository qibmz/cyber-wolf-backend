import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResponse } from './infinity-pagination-response.dto';

type ApiSuccessResponseOptions = {
  nullable?: boolean;
  description?: string;
  /** HTTP 业务码示例，默认 200；创建接口可用 201 */
  codeExample?: number;
};

/**
 * Swagger 用：描述全局 ResponseInterceptor 包装后的成功响应 { code, msg, data }。
 */
export function ApiSuccessResponse<T>(
  classReference: Type<T>,
  options: ApiSuccessResponseOptions = {},
) {
  const codeExample = options.codeExample ?? 200;

  abstract class Success {
    @ApiProperty({ example: codeExample, description: '业务状态码' })
    code!: number;

    @ApiProperty({ example: 'success', description: '提示信息' })
    msg!: string;

    @ApiProperty({
      type: classReference,
      nullable: options.nullable ?? false,
      description: options.description ?? '业务数据',
    })
    data!: T | null;
  }

  Object.defineProperty(Success, 'name', {
    writable: false,
    value: `ApiSuccess${classReference.name}${
      options.nullable ? 'Nullable' : ''
    }${codeExample !== 200 ? String(codeExample) : ''}ResponseDto`,
  });

  return Success;
}

/**
 * Swagger 用：{ code, msg, data: T[] }
 */
export function ApiSuccessArrayResponse<T>(classReference: Type<T>) {
  abstract class Success {
    @ApiProperty({ example: 200, description: '业务状态码' })
    code!: number;

    @ApiProperty({ example: 'success', description: '提示信息' })
    msg!: string;

    @ApiProperty({
      type: [classReference],
      description: '业务数据列表',
    })
    data!: T[];
  }

  Object.defineProperty(Success, 'name', {
    writable: false,
    value: `ApiSuccess${classReference.name}ArrayResponseDto`,
  });

  return Success;
}

/**
 * Swagger 用：分页列表的实际响应为
 * { code, msg, data: { data: T[], hasNextPage, total } }
 */
export function ApiSuccessPaginationResponse<T>(classReference: Type<T>) {
  const Pagination = InfinityPaginationResponse(classReference);
  return ApiSuccessResponse(Pagination as Type<unknown>, {
    description: '分页数据（内层 data 为列表项数组）',
  });
}
