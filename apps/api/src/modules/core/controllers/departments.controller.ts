import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from '../services/departments.service';
import { CreateDepartmentDto } from '../dto/rbac.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('departments.read')
  findAll() {
    return this.departmentsService.findAll();
  }

  @Post()
  @RequirePermissions('departments.create')
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Post('users/:id')
  @RequirePermissions('departments.assign')
  assignToUser(
    @Param('id') userId: string,
    @Body('departmentId') departmentId: string,
  ) {
    return this.departmentsService.assignToUser(userId, departmentId);
  }
}
