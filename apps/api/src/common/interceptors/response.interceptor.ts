import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

type ResponseWithMeta = {
  __standardResponse: true;
  data: unknown;
  meta: Record<string, unknown>;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          typeof data === "object" &&
          data !== null &&
          "__standardResponse" in data &&
          (data as { __standardResponse?: unknown }).__standardResponse === true
        ) {
          const response = data as ResponseWithMeta;
          return {
            success: true as const,
            data: response.data,
            meta: response.meta,
          } as Response<T>;
        }

        return {
          success: true as const,
          data,
        } as Response<T>;
      }),
    );
  }
}
