import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from '../services/leads.service';
import { CreateLeadDto, UpdateLeadDto, AssignLeadDto, CreateContactLogDto, ChangeLeadStageDto } from '../dto/lead.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @RequirePermissions('leads.create')
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @RequirePermissions('leads.read')
  findAll() {
    return this.leadsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('leads.read')
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('leads.update')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Post(':id/assign')
  @RequirePermissions('leads.assign')
  assign(@Param('id') id: string, @Body() assignLeadDto: AssignLeadDto) {
    return this.leadsService.assign(id, assignLeadDto);
  }

  @Post(':id/contact-log')
  @RequirePermissions('leads.update')
  addContactLog(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateContactLogDto,
  ) {
    return this.leadsService.addContactLog(id, user.id, dto);
  }

  @Post(':id/stage')
  @RequirePermissions('leads.update')
  changeStage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ChangeLeadStageDto,
  ) {
    return this.leadsService.changeStage(id, user.id, dto);
  }

  @Post(':id/convert')
  @RequirePermissions('leads.convert')
  convertToClient(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.leadsService.convertToClient(id, user.id);
  }
}
