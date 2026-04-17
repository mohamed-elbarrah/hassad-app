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
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { UpdateStageDto } from "./dto/update-stage.dto";
import { UpdateRequirementsDto } from "./dto/update-requirements.dto";
import { ClientFiltersDto } from "./dto/client-filters.dto";
import type { JwtPayload } from "../common/decorators/current-user.decorator";

/**
 * ClientsController — all routes are protected by JWT + RBAC.
 * Business logic is delegated 100% to ClientsService.
 */
@Controller("clients")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * GET /v1/clients
   * Returns a paginated, filtered list of clients.
   * ADMIN: all clients. SALES: own assigned clients only.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PM)
  findAll(@Query() filters: ClientFiltersDto, @CurrentUser() user: JwtPayload) {
    return this.clientsService.findAll(filters, user);
  }

  /**
   * GET /v1/clients/:id
   * Returns a single client with full relational detail.
   */
  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PM)
  findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.clientsService.findOne(id, user);
  }

  /**
   * POST /v1/clients
   * Creates a new client. assignedToId is set from the authenticated user.
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateClientDto, @CurrentUser() user: JwtPayload) {
    return this.clientsService.create(dto, user);
  }

  /**
   * PATCH /v1/clients/:id
   * Updates general client fields. For stage transitions, use PATCH /:id/stage.
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.update(id, dto, user);
  }

  @Patch(":id/stage")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateStage(
    @Param("id") id: string,
    @Body() dto: UpdateStageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.updateStage(id, dto, user);
  }

  @Patch(":id/requirements")
  @Roles(UserRole.ADMIN, UserRole.SALES)
  updateRequirements(
    @Param("id") id: string,
    @Body() dto: UpdateRequirementsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.updateRequirements(id, dto, user);
  }

  @HttpDelete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return this.clientsService.delete(id, user);
  }
}
