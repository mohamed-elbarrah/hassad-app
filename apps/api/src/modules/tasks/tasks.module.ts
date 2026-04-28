import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { NotificationsModule } from '../notifications/notifications.module';

const taskUploadStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const destination = join(process.cwd(), 'uploads', 'tasks');
    mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (_req, file, cb) => {
    const unique = randomBytes(16).toString('hex');
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@Module({
  imports: [
    NotificationsModule,
    MulterModule.register({
      storage: taskUploadStorage,
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
