import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error'

    const extractedMessage =
      typeof message === 'object' && message !== null && 'message' in message
        ? (message as { message: string | string[] }).message
        : message;

    const normalizedMessage = Array.isArray(extractedMessage)
      ? extractedMessage.join('; ')
      : extractedMessage;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: normalizedMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
