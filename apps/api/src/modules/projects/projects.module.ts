import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsService } from './services/projects.service';
import { TasksModule } from '../tasks/tasks.module';
import { NotificationsModule } from '../notifications/notifications.module';

const projectFileStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const destination = join(process.cwd(), 'uploads', 'projects');
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
    TasksModule,
    NotificationsModule,
    MulterModule.register({
      storage: projectFileStorage,
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
