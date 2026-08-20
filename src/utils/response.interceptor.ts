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
        // - 无返回体（204/文件下载等由 controller 直接发送的响应）
        // - 流式文件
        // - 响应已发送（避免二次写 body 报错）
        if (
          data === undefined ||
          data === null ||
          data instanceof StreamableFile ||
          response.headersSent
        ) {
          return data;
        }

        return {
          code: HttpStatus.OK,
          msg: 'success',
          data,
        };
      }),
    );
  }
}
