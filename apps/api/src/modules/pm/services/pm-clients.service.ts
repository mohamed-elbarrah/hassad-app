import { Injectable } from "@nestjs/common";

import { CrmClientsService } from "../../crm/services/crm-clients.service";

@Injectable()
export class PmClientsService {
  constructor(private readonly crmClientsService: CrmClientsService) {}

  async getFull(clientId: string) {
    return this.crmClientsService.getFull(clientId);
  }
}
