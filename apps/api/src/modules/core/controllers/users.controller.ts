import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService, UserListFilters } from '../services/users.service';
import { DepartmentsService } from '../services/departments.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';
import { UserRole, TaskDepartment } from '@hassad/shared';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Post()
  @RequirePermissions('users.create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('users.read')
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('department') department?: TaskDepartment,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: UserListFilters = {
      search: search || undefined,
      role: role || undefined,
      department: department || undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    // Allow users to update their own profile (self-service)
    // Only admin can update other users
    if (id !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Self-update: restrict fields that can be updated
    if (id === currentUser.id && currentUser.role !== UserRole.ADMIN) {
      // Users can only update: name, email, phoneWhatsapp, password, avatarUrl
      // Cannot update: role, department, isActive
      const allowedFields = ['name', 'email', 'phoneWhatsapp', 'password', 'avatarUrl'];
      const requestedFields = Object.keys(updateUserDto);
      const hasRestrictedFields = requestedFields.some(field => !allowedFields.includes(field));

      if (hasRestrictedFields) {
        throw new ForbiddenException('You can only update your profile information (name, email, phone, password, avatar)');
      }
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('users.update')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/reactivate')
  @RequirePermissions('users.update')
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivate(id);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Spec-compliant path: POST /users/:id/departments
  @Post(':id/departments')
  @RequirePermissions('departments.assign')
  assignDepartment(
    @Param('id') userId: string,
    @Body('departmentId') departmentId: string,
  ) {
    return this.departmentsService.assignToUser(userId, departmentId);
  }
}
