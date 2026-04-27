import { Module } from '@nestjs/common';
import { LeadsController } from './controllers/leads.controller';
import { LeadsService } from './services/leads.service';
import { ClientsController } from './controllers/clients.controller';
import { ClientsService } from './services/clients.service';
import { AutomationController } from './controllers/automation.controller';
import { AutomationService } from './services/automation.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [LeadsController, ClientsController, AutomationController],
  providers: [LeadsService, ClientsService, AutomationService],
  exports: [LeadsService, ClientsService],
})
export class CrmModule {}
