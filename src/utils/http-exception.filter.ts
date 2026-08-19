import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

export type FieldErrors = Record<string, unknown>;

export interface ApiErrorBody {
  status: number;
  msg: string;
  errors: FieldErrors;
}

export interface ExceptionFilterOptions {
  headerLanguage: string;
  fallbackLanguage: string;
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
};

/**
 * Resolve the response language from the request header
 * (e.g. `x-custom-lang`), falling back to the configured default.
 */
export function resolveLanguage(
  request: Request,
  options: ExceptionFilterOptions,
): string {
  const headerValue = request?.headers?.[options.headerLanguage.toLowerCase()];
  return typeof headerValue === 'string' && headerValue.length > 0
    ? headerValue
    : options.fallbackLanguage;
}

/**
 * Translate a message key through nestjs-i18n. Unknown keys (including raw
 * class-validator constraint strings) are returned unchanged. Supports the
 * `key:arg` shorthand used for dynamic messages such as
 * `needLoginViaProvider:google`. Keys are looked up in the `errors` i18n
 * namespace (each JSON file in nestjs-i18n is its own namespace); keys that
 * already carry a namespace are used as-is.
 */
export function translateMessage(
  i18n: I18nService,
  key: string,
  lang: string,
): string {
  if (!key) {
    return key;
  }

  const separatorIndex = key.indexOf(':');
  const baseKey = separatorIndex === -1 ? key : key.slice(0, separatorIndex);
  const args =
    separatorIndex === -1 ? undefined : key.slice(separatorIndex + 1);
  const lookupKey = baseKey.includes('.') ? baseKey : `errors.${baseKey}`;

  try {
    const translated = i18n.t(lookupKey, {
      lang,
      ...(args ? { args: { provider: args } } : {}),
    }) as string;
    return translated && translated !== lookupKey ? translated : key;
  } catch {
    return key;
  }
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly i18n: I18nService,
    private readonly options: ExceptionFilterOptions,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json(this.buildBody(exception, status, request));
  }

  private buildBody(
    exception: HttpException,
    status: number,
    request: Request,
  ): ApiErrorBody {
    const lang = resolveLanguage(request, this.options);
    const responseBody = exception.getResponse();

    if (this.isRecord(responseBody)) {
      const body = responseBody;

      // Boilerplate style: { status, errors: { field: messageKey } }
      if (this.isRecord(body.errors)) {
        return {
          status,
          msg:
            this.firstMessage(body.errors, lang) ?? this.statusMessage(status),
          errors: body.errors,
        };
      }

      if (typeof body.message === 'string') {
        return {
          status,
          msg: translateMessage(this.i18n, body.message, lang),
          errors: {},
        };
      }

      if (Array.isArray(body.message) && typeof body.message[0] === 'string') {
        return {
          status,
          msg: translateMessage(this.i18n, body.message[0], lang),
          errors: {},
        };
      }

      if (typeof body.error === 'string') {
        return {
          status,
          msg: translateMessage(this.i18n, body.error, lang),
          errors: {},
        };
      }
    }

    if (typeof responseBody === 'string') {
      return {
        status,
        msg: translateMessage(this.i18n, responseBody, lang),
        errors: {},
      };
    }

    return {
      status,
      msg: this.statusMessage(status),
      errors: {},
    };
  }

  /** First string message found in the field error map (depth-first). */
  private firstMessage(value: unknown, lang: string): string | undefined {
    if (typeof value === 'string' && value.length > 0) {
      return translateMessage(this.i18n, value, lang);
    }

    if (this.isRecord(value)) {
      for (const child of Object.values(value)) {
        const message = this.firstMessage(child, lang);
        if (message) {
          return message;
        }
      }
    }

    return undefined;
  }

  private statusMessage(status: number): string {
    return DEFAULT_STATUS_MESSAGES[status] ?? 'Error';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
