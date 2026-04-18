import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@hassad/shared";
import { UsersService } from "./users.service";
import { UserSearchFiltersDto } from "./dto/user-search-filters.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /v1/users
   * Searchable, paginated list of users. Returns safe fields only (no passwordHash).
   * Used by the frontend for PM/client comboboxes.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.PM, UserRole.SALES)
  searchUsers(@Query() filters: UserSearchFiltersDto) {
    return this.usersService.searchUsers(filters);
  }

  /**
   * POST /v1/users
   * Create a new employee account. Admin only.
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  /**
   * GET /v1/users/:id
   * Get a single user by ID. Admin only.
   */
  @Get(":id")
  @Roles(UserRole.ADMIN)
  getUserById(@Param("id") id: string) {
    return this.usersService.getUserById(id);
  }

  /**
   * PATCH /v1/users/:id
   * Update user fields. Admin only.
   */
  @Patch(":id")
  @Roles(UserRole.ADMIN)
  updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  /**
   * PATCH /v1/users/:id/deactivate
   * Toggle user isActive status. Admin only.
   */
  @Patch(":id/deactivate")
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param("id") id: string) {
    return this.usersService.deactivateUser(id);
  }
}
