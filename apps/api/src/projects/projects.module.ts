import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

/**
 * ProjectsModule — encapsulates the Project Management feature.
 * PrismaModule is @Global(), so PrismaService is available without a local import.
 */
@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
