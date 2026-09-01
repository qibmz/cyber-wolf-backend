import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';

export interface ApiSuccessBody<T> {
  code: number;
  msg: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // 跳过不需要包装的响应：
        // - undefined（如 204 NO_CONTENT）
        // - 流式文件
        // - 响应已发送（避免二次写 body 报错）
        // null 会包装为 { code, msg, data: null }，与详情「未找到」约定一致
        if (
          data === undefined ||
          data instanceof StreamableFile ||
          response.headersSent
        ) {
          return data;
        }

        const statusCode = response.statusCode || HttpStatus.OK;

        return {
          code: statusCode,
          msg: 'success',
          data,
        };
      }),
    );
  }
}
