import { Module } from '@nestjs/common';
import { FinanceController } from './controllers/finance.controller';
import { FinanceService } from './services/finance.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
