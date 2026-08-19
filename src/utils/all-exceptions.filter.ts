import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import {
  ApiErrorBody,
  ExceptionFilterOptions,
  HttpExceptionFilter,
  resolveLanguage,
  translateMessage,
} from './http-exception.filter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly httpExceptionFilter: HttpExceptionFilter;

  constructor(
    private readonly i18n: I18nService,
    private readonly options: ExceptionFilterOptions,
  ) {
    this.httpExceptionFilter = new HttpExceptionFilter(i18n, options);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) {
      return this.httpExceptionFilter.catch(exception, host);
    }

    this.logger.error(
      'Unhandled exception:',
      exception instanceof Error ? exception.stack : String(exception),
    );

    if (host.getType() !== 'http') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const lang = resolveLanguage(request, this.options);
    const body: ApiErrorBody = {
      status,
      msg: translateMessage(this.i18n, 'internalServerError', lang),
      errors: {},
    };

    response.status(status).json(body);
  }
}
