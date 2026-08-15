import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminFeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.companySetting.findMany({
      where: { key: { startsWith: "feature." } },
    });
    return settings.map((s) => ({
      key: s.key.replace("feature.", ""),
      enabled: s.value === true || s.value === "true",
      value: s.value,
    }));
  }

  async update(key: string, enabled: boolean) {
    return this.prisma.companySetting.upsert({
      where: { key: `feature.${key}` },
      create: { key: `feature.${key}`, value: enabled },
      update: { value: enabled },
    });
  }

  async getDefaults() {
    return {
      admin_dashboard_v2: {
        label: "New admin dashboard",
        default: true,
        description: "Enable the updated admin dashboard",
      },
      ai_module: {
        label: "AI assistant",
        default: true,
        description: "Enable the AI assistant module",
      },
      client_portal: {
        label: "Client portal",
        default: true,
        description: "Enable the client portal",
      },
      automation_rules: {
        label: "Automation rules",
        default: true,
        description: "Enable request automation rules",
      },
      notifications: {
        label: "Notifications",
        default: true,
        description: "Enable the notification system",
      },
      public_registration: {
        label: "Public registration",
        default: false,
        description: "Allow new client account registration"
      },
    };
  }
}
