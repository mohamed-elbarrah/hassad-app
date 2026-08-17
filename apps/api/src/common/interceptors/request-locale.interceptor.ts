import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Request, Response } from "express";
import {
  resolveRequestLocale,
  runWithBackendLocale,
} from "../localization/request-locale";

@Injectable()
export class RequestLocaleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const locale = resolveRequestLocale(
      request.headers["x-locale"],
      request.headers["accept-language"],
    );

    response.setHeader("Content-Language", locale);

    return new Observable((subscriber) =>
      runWithBackendLocale(locale, () => {
        const subscription = next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });

        return () => subscription.unsubscribe();
      }),
    );
  }
}
