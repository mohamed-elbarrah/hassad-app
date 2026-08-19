// apps/api/src/main.ts
import { NestFactory } from "@nestjs/core";
import { BadRequestException, ValidationPipe, Logger } from "@nestjs/common";
import type { ValidationError } from "class-validator";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import * as cookieParser from "cookie-parser";

function validationConstraintCode(constraint: string): string {
  const codes: Record<string, string> = {
    isEmail: "INVALID_EMAIL",
    isEnum: "INVALID_ENUM",
    isIn: "INVALID_CHOICE",
    isInt: "INVALID_INTEGER",
    isString: "INVALID_STRING",
    isUUID: "INVALID_UUID",
    max: "VALUE_TOO_LARGE",
    maxLength: "TOO_LONG",
    min: "VALUE_TOO_SMALL",
    whitelistValidation: "UNKNOWN_FIELD",
  };

  return codes[constraint] ?? "INVALID_VALUE";
}

function collectValidationFields(
  errors: ValidationError[],
  parentPath = "",
): Record<string, { code: string }> {
  return errors.reduce<Record<string, { code: string }>>((fields, error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      const [constraint] = Object.keys(error.constraints);
      fields[path] = { code: validationConstraintCode(constraint) };
    }

    if (error.children?.length) {
      Object.assign(fields, collectValidationFields(error.children, path));
    }

    return fields;
  }, {});
}

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
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: "VALIDATION_ERROR",
          details: { fields: collectValidationFields(errors) },
        }),
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
