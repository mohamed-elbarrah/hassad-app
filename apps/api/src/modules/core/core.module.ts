import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';
import { PermissionsController } from './controllers/permissions.controller';
import { PermissionsService } from './services/permissions.service';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsService } from './services/departments.service';
import { AdminController } from './controllers/admin.controller';

@Module({
  controllers: [
    UsersController,
    RolesController,
    PermissionsController,
    DepartmentsController,
    AdminController,
  ],
  providers: [
    UsersService,
    RolesService,
    PermissionsService,
    DepartmentsService,
  ],
  exports: [UsersService, RolesService],
})
export class CoreModule {}
