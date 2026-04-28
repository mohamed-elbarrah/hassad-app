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
import { ContractsService } from '../services/contracts.service';
import { CreateContractDto, UpdateContractDto, SignContractDto, CreateVersionDto } from '../dto/contract.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @RequirePermissions('contracts.create')
  create(@CurrentUser() user: any, @Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(user.id, createContractDto);
  }

  @Get()
  @RequirePermissions('contracts.read')
  findAll(@Query() filters: any) {
    return this.contractsService.findAll(filters);
  }

  @Get(':id')
  @RequirePermissions('contracts.read')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('contracts.update')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(id, dto);
  }

  @Post(':id/send')
  @RequirePermissions('contracts.send')
  send(@Param('id') id: string) {
    return this.contractsService.send(id);
  }

  @Post(':id/sign')
  @RequirePermissions('contracts.sign')
  sign(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: SignContractDto) {
    return this.contractsService.sign(id, user.id, dto);
  }

  @Post(':id/activate')
  @RequirePermissions('contracts.activate')
  activate(@Param('id') id: string) {
    return this.contractsService.activate(id);
  }

  @Post(':id/cancel')
  @RequirePermissions('contracts.cancel')
  cancel(@Param('id') id: string) {
    return this.contractsService.cancel(id);
  }

  @Post(':id/versions')
  @RequirePermissions('contracts.manage_versions')
  createVersion(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateVersionDto,
  ) {
    return this.contractsService.createVersion(id, user.id, dto);
  }
}
