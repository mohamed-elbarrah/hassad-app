import { Module } from '@nestjs/common';
import { LeadsController } from './controllers/leads.controller';
import { LeadsService } from './services/leads.service';
import { ClientsController } from './controllers/clients.controller';
import { ClientsService } from './services/clients.service';

@Module({
  controllers: [LeadsController, ClientsController],
  providers: [LeadsService, ClientsService],
  exports: [LeadsService, ClientsService],
})
export class CrmModule {}
