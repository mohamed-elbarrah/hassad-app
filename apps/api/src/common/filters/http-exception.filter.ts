import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const extractedMessage =
      typeof message === "object" && message !== null && "message" in message
        ? (message as { message: string | string[] }).message
        : message;

    const normalizedMessage = Array.isArray(extractedMessage)
      ? extractedMessage.join("; ")
      : extractedMessage;

    const path = request.originalUrl ?? request.url;

    if (
      !(exception instanceof HttpException) ||
      status >= HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      const summary =
        exception instanceof Error
          ? `${exception.name}: ${exception.message}`
          : String(normalizedMessage);

      this.logger.error(
        `${request.method} ${path} -> ${status} ${summary}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: normalizedMessage,
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
