import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

/**
 * ClientsModule — encapsulates the CRM Clients feature.
 * PrismaModule is @Global(), so PrismaService is available without a local import.
 */
@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
