import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { RequestsModule } from "../requests/requests.module";
import { CrmModule } from "../crm/crm.module";
import { SalesClientsController } from "./sales-clients.controller";

@Module({
  imports: [PrismaModule, RequestsModule, CrmModule],
  controllers: [SalesController, SalesClientsController],
  providers: [SalesService],
})
export class SalesModule {}
