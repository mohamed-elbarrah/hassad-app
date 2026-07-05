// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger(),
    rawBody: true,
  });

  app.setGlobalPrefix("v1");

  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true, // auto-transforms query params to their declared types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Note: HttpExceptionFilter is registered via APP_FILTER in AppModule
  // This ensures proper DI and global error handling

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 API server running on http://localhost:${port}/v1`);
  logger.log(
    `📊 Health dashboard available at http://localhost:${port}/v1/health`,
  );
}

// Handle bootstrap errors
bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
