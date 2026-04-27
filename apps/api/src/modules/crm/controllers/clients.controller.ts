import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from '../services/clients.service';
import { UpdateClientDto } from '../dto/client.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients.read')
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('clients.read')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('clients.update')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Get(':id/activity')
  @RequirePermissions('clients.read_activity')
  getActivity(@Param('id') id: string) {
    return this.clientsService.getActivity(id);
  }
}
