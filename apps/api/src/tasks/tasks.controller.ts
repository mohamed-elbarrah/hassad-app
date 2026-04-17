import {
  Controller,
  Get,
  Post,
  Patch,
  Delete as HttpDelete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@hassad/shared";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
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
   * DELETE /v1/tasks/:id
   * Hard delete — ADMIN only.
   */
  @HttpDelete("tasks/:id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.tasksService.remove(id);
  }
}
