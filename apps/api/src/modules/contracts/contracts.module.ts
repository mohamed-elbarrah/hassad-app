import { Module } from '@nestjs/common';
import { ContractsController } from './controllers/contracts.controller';
import { ContractsService } from './services/contracts.service';
import { ContractCronService } from './services/contract-cron.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [NotificationsModule, CrmModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractCronService],
  exports: [ContractsService],
})
export class ContractsModule {}
