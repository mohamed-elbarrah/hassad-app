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
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@hassad/shared";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateProjectStatusDto } from "./dto/update-project-status.dto";
import { ProjectFiltersDto } from "./dto/project-filters.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

/**
 * ProjectsController — all routes are protected by JWT + RBAC.
 * Business logic is delegated 100% to ProjectsService.
 */
@Controller("projects")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /v1/projects
   * ADMIN: all projects. PM: own projects only.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.PM)
  findAll(
    @Query() filters: ProjectFiltersDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findAll(filters, user);
  }

  /**
   * GET /v1/projects/:id
   * ADMIN: any project. PM: own projects only.
   */
  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.PM)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.findOne(id, user);
  }

  /**
   * POST /v1/projects
   * Creates a new project. If caller is PM, managerId is forced to their own id.
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.PM)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.create(dto, user);
  }

  /**
   * PATCH /v1/projects/:id
   * Updates project fields. PM may only update their own projects.
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.PM)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  /**
   * PATCH /v1/projects/:id/status
   * Dedicated endpoint for project status transitions.
   */
  @Patch(":id/status")
  @Roles(UserRole.ADMIN, UserRole.PM)
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateStatus(id, dto, user);
  }

  /**
   * DELETE /v1/projects/:id
   * Hard delete — ADMIN only. Cascades to tasks.
   */
  @HttpDelete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.projectsService.remove(id);
  }
}
