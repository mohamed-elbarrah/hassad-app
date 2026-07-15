import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { AiAssistantController } from "./ai-assistant.controller";
import { AiAssistantService } from "./ai-assistant.service";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { AiModule } from "../ai/ai.module";

import { GetLeadPipelineSummaryTool, GetLeadStatusDistributionTool, GetRecentLeadsTool } from "./tools/crm.tools";
import { GetRevenueSummaryTool, GetInvoiceStatusTool, GetPendingPaymentsTool } from "./tools/finance.tools";
import { GetClientSummaryTool, GetClientStatusDistributionTool } from "./tools/client.tools";
import { GetProjectSummaryTool, GetTaskDistributionTool, GetUpcomingDeadlinesTool } from "./tools/pm.tools";
import { GetCampaignSummaryTool, GetCampaignPerformanceTool } from "./tools/marketing.tools";

@Module({
  imports: [AiModule],
  controllers: [AiAssistantController],
  providers: [
    AiAssistantService,
    ToolRegistryService,

    // CRM tools
    GetLeadPipelineSummaryTool,
    GetLeadStatusDistributionTool,
    GetRecentLeadsTool,

    // Finance tools
    GetRevenueSummaryTool,
    GetInvoiceStatusTool,
    GetPendingPaymentsTool,

    // Client tools
    GetClientSummaryTool,
    GetClientStatusDistributionTool,

    // PM tools
    GetProjectSummaryTool,
    GetTaskDistributionTool,
    GetUpcomingDeadlinesTool,

    // Marketing tools
    GetCampaignSummaryTool,
    GetCampaignPerformanceTool,
  ],
  exports: [AiAssistantService],
})
export class AiAssistantModule implements OnModuleInit {
  private readonly logger = new Logger(AiAssistantModule.name);

  constructor(
    private toolRegistry: ToolRegistryService,
    private getLeadPipelineSummary: GetLeadPipelineSummaryTool,
    private getLeadStatusDistribution: GetLeadStatusDistributionTool,
    private getRecentLeads: GetRecentLeadsTool,
    private getRevenueSummary: GetRevenueSummaryTool,
    private getInvoiceStatus: GetInvoiceStatusTool,
    private getPendingPayments: GetPendingPaymentsTool,
    private getClientSummary: GetClientSummaryTool,
    private getClientStatusDistribution: GetClientStatusDistributionTool,
    private getProjectSummary: GetProjectSummaryTool,
    private getTaskDistribution: GetTaskDistributionTool,
    private getUpcomingDeadlines: GetUpcomingDeadlinesTool,
    private getCampaignSummary: GetCampaignSummaryTool,
    private getCampaignPerformance: GetCampaignPerformanceTool,
  ) {}

  onModuleInit() {
    this.toolRegistry.register(
      this.getLeadPipelineSummary,
      this.getLeadStatusDistribution,
      this.getRecentLeads,
      this.getRevenueSummary,
      this.getInvoiceStatus,
      this.getPendingPayments,
      this.getClientSummary,
      this.getClientStatusDistribution,
      this.getProjectSummary,
      this.getTaskDistribution,
      this.getUpcomingDeadlines,
      this.getCampaignSummary,
      this.getCampaignPerformance,
    );
    this.logger.log("AI Assistant tools registered successfully");
  }
}
