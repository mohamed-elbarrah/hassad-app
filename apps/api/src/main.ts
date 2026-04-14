// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(), // NestJS 11 ConsoleLogger with JSON support
  })

  app.setGlobalPrefix('v1')

  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true,        // auto-transforms query params to their declared types
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
