import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../app.module';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

let app: INestApplication;

export async function getApp(): Promise<INestApplication> {
  if (app) return app;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });

  await app.init();
  return app;
}

export async function closeApp(): Promise<void> {
  if (app) {
    await app.close();
    app = undefined;
  }
}
