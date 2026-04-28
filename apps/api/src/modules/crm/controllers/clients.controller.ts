import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from '../services/clients.service';
import { CreateClientDto, UpdateClientDto, HandoverClientDto } from '../dto/client.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @RequirePermissions('clients.create')
  create(@CurrentUser() user: any, @Body() dto: CreateClientDto) {
    return this.clientsService.create(user.id, dto);
  }

  @Get()
  @RequirePermissions('clients.read')
  findAll(@Query() filters: any) {
    return this.clientsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('clients.read')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('clients.update')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, user.id, updateClientDto);
  }

  @Get(':id/activity')
  @RequirePermissions('clients.read_activity')
  getActivity(@Param('id') id: string) {
    return this.clientsService.getActivity(id);
  }

  @Post(':id/handover')
  @RequirePermissions('clients.handover')
  handover(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: HandoverClientDto) {
    return this.clientsService.handover(id, user.id, dto);
  }
}
