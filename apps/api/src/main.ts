// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import * as cookieParser from "cookie-parser";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger(),
    rawBody: true,
  });

  app.setGlobalPrefix("v1");

  // process.cwd() = apps/api/ (NestJS CLI runs from the package dir).
  // Do NOT use __dirname here: the compiled output lives at dist/src/main.js,
  // so __dirname = dist/src/ and join(__dirname, '..', 'uploads') would
  // wrongly resolve to dist/uploads/ instead of the real uploads/ folder.
  app.useStaticAssets(process.cwd() + "/uploads", {
    prefix: "/uploads",
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true, // auto-transforms query params to their declared types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
