import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { DepartmentsService } from '../services/departments.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

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
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users.read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
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
