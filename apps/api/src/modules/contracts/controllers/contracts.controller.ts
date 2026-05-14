import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from '../services/contracts.service';
import { FinanceService } from '../../finance/services/finance.service';
import {
  CreateContractDto,
  UpdateContractDto,
  SignContractDto,
  SignByTokenDto,
  CreateVersionDto,
} from '../dto/contract.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StorageService } from '../../../common/storage/storage.service';
import { StorageCategory } from '../../../common/storage/storage.constants';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly financeService: FinanceService,
    private readonly storageService: StorageService,
  ) {}

  // ─── Protected endpoints ───────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @CurrentUser() user: any,
    @Body() createContractDto: CreateContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    const uploadResult = await this.storageService.upload({
      category: StorageCategory.CONTRACT,
      entityId: 'pending',
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
    const contract = await this.contractsService.create(user.id, uploadResult.key, createContractDto);

    try {
      await this.financeService.generateInvoiceFromContract(contract.id, user.id);
    } catch (error) {
      console.error(`Failed to auto-generate invoice for contract ${contract.id}:`, error);
    }

    return contract;
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.read_public')
  getMyContracts(@CurrentUser() user: any) {
    return this.contractsService.getMyContracts(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.read')
  findAll(@Query() filters: any) {
    return this.contractsService.findAll(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.read')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.update')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(id, dto);
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.send')
  send(@Param('id') id: string) {
    return this.contractsService.send(id);
  }

  @Post(':id/sign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.sign')
  sign(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SignContractDto,
  ) {
    return this.contractsService.sign(id, user.id, dto);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.activate')
  activate(@Param('id') id: string) {
    return this.contractsService.activate(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.cancel')
  cancel(@Param('id') id: string) {
    return this.contractsService.cancel(id);
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.manage_versions')
  @UseInterceptors(FileInterceptor('file'))
  async createVersion(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateVersionDto,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required for a new version');
    }
    const uploadResult = await this.storageService.uploadForSubEntity(
      StorageCategory.CONTRACT,
      id,
      'versions',
      `v${Date.now()}`,
      { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
    );
    return this.contractsService.createVersion(id, user.id, uploadResult.key, dto);
  }

  @Post(':id/generate-invoice')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('finance.create_invoice')
  generateInvoice(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.financeService.generateInvoiceFromContract(id, user.id);
  }

  // ─── Public share-link endpoints (CLIENT token-based) ─────────────────────

  @Get('share/:token')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.read_public')
  findByToken(@Param('token') token: string) {
    return this.contractsService.findByToken(token);
  }

  @Post('share/:token/sign')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.sign_public')
  signByToken(
    @Param('token') token: string,
    @Body() dto: SignByTokenDto,
  ) {
    return this.contractsService.signByToken(token, dto);
  }
}
