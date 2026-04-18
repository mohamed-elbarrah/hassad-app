import {
  Controller,
  Get,
  Post,
  Patch,
  Delete as HttpDelete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import * as fs from "fs";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@hassad/shared";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { MyTasksFiltersDto } from "./dto/my-tasks-filters.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

/**
 * TasksController — handles both nested (project-scoped) and top-level task routes.
 * All routes are protected by JWT + RBAC.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * GET /v1/projects/:projectId/tasks
   * Lists all tasks in a project.
   * ADMIN: any project. PM: own projects only.
   */
  @Get("projects/:projectId/tasks")
  @Roles(UserRole.ADMIN, UserRole.PM)
  findAllByProject(
    @Param("projectId") projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.findAllByProject(projectId, user);
  }

  /**
   * POST /v1/projects/:projectId/tasks
   * Creates a new task in the specified project.
   * ADMIN: any project. PM: own projects only.
   */
  @Post("projects/:projectId/tasks")
  @Roles(UserRole.ADMIN, UserRole.PM)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.create(projectId, dto, user);
  }

  /**
   * GET /v1/tasks/my
   * Returns tasks scoped to the caller.
   * EMPLOYEE: own tasks only. PM: own + managed projects. ADMIN: all.
   */
  @Get("tasks/my")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  getMyTasks(
    @Query() filters: MyTasksFiltersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getMyTasks(user, filters);
  }

  /**
   * GET /v1/tasks/my/stats
   * Returns dashboard stats for the caller's task scope.
   */
  @Get("tasks/my/stats")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  getMyTaskStats(@CurrentUser() user: JwtPayload) {
    return this.tasksService.getMyTaskStats(user);
  }

  /**
   * GET /v1/tasks/:id
   * Returns a single task with relations.
   * ADMIN+PM: any task in their projects. EMPLOYEE: own tasks only.
   */
  @Get("tasks/:id")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.findOne(id, user);
  }

  /**
   * PATCH /v1/tasks/:id
   * Updates general task fields. ADMIN + PM only.
   */
  @Patch("tasks/:id")
  @Roles(UserRole.ADMIN, UserRole.PM)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  /**
   * PATCH /v1/tasks/:id/status
   * Dedicated status transition endpoint.
   * ADMIN + PM: any task in their scope. EMPLOYEE: own tasks only.
   */
  @Patch("tasks/:id/status")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.updateStatus(id, dto, user);
  }

  /**
   * PATCH /v1/tasks/:id/archive
   * Toggles archivedAt on the task.
   * EMPLOYEE: own tasks. PM: tasks in own projects. ADMIN: all.
   */
  @Patch("tasks/:id/archive")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  toggleArchive(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.toggleArchive(id, user);
  }

  /**
   * DELETE /v1/tasks/:id
   * Hard delete — ADMIN only.
   */
  @HttpDelete("tasks/:id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.tasksService.remove(id);
  }

  // ─── File endpoints ──────────────────────────────────────────────────────────

  /**
   * POST /v1/tasks/:taskId/files
   * Uploads a file and attaches it to the task.
   */
  @Post("tasks/:taskId/files")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = join(process.cwd(), "uploads", "tasks");
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed =
          /jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|mov|zip|rar|svg|webp/;
        const ext = extname(file.originalname).toLowerCase().replace(".", "");
        if (allowed.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error(`File type .${ext} is not allowed`), false);
        }
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  uploadFile(
    @Param("taskId") taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException("File is required");
    return this.tasksService.uploadFile(taskId, user, file);
  }

  /**
   * GET /v1/tasks/:taskId/files
   * Lists all files attached to a task.
   */
  @Get("tasks/:taskId/files")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  getTaskFiles(
    @Param("taskId") taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getTaskFiles(taskId, user);
  }

  /**
   * DELETE /v1/tasks/:taskId/files/:fileId
   * Deletes a file from disk and the database.
   */
  @HttpDelete("tasks/:taskId/files/:fileId")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFile(
    @Param("taskId") taskId: string,
    @Param("fileId") fileId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.deleteFile(taskId, fileId, user);
  }

  /**
   * GET /v1/tasks/:taskId/files/:fileId/download
   * Streams the file with the correct Content-Disposition header.
   */
  @Get("tasks/:taskId/files/:fileId/download")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  async downloadFile(
    @Param("taskId") taskId: string,
    @Param("fileId") fileId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { filePath, fileName, mimeType } =
      await this.tasksService.downloadFile(taskId, fileId, user);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  /**
   * POST /v1/tasks/:taskId/comments
   * Adds a comment to a task.
   * ADMIN: any task. PM: own projects only. EMPLOYEE: own tasks only.
   */
  @Post("tasks/:taskId/comments")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param("taskId") taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.addComment(taskId, user, dto);
  }

  /**
   * GET /v1/tasks/:taskId/comments
   * Returns all comments for a task in ascending order.
   * ADMIN: any task. PM: own projects only. EMPLOYEE: own tasks only.
   */
  @Get("tasks/:taskId/comments")
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.EMPLOYEE)
  getComments(
    @Param("taskId") taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.getComments(taskId, user);
  }
}
