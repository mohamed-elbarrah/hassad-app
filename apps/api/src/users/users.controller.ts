import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "@hassad/shared";
import { UsersService } from "./users.service";
import { UserSearchFiltersDto } from "./dto/user-search-filters.dto";

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
}
