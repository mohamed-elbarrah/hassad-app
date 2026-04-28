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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { ContractsService } from '../services/contracts.service';
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

// ─── Multer storage config ────────────────────────────────────────────────────
const contractStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'contracts'),
  filename: (_req, file, cb) => {
    const unique = randomBytes(16).toString('hex');
    const ext = extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

// Note: class-level guards are NOT used so that public share routes can be
// placed in this same controller without guards.
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ─── Protected endpoints ───────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('contracts.create')
  @UseInterceptors(FileInterceptor('file', { storage: contractStorage }))
  async create(
    @CurrentUser() user: any,
    @Body() createContractDto: CreateContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    const filePath = `/uploads/contracts/${file.filename}`;
    return this.contractsService.create(user.id, filePath, createContractDto);
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
  createVersion(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateVersionDto,
  ) {
    return this.contractsService.createVersion(id, user.id, dto);
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
