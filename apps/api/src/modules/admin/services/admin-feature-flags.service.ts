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
        label: "لوحة الإدارة الجديدة",
        default: true,
        description: "تفعيل لوحة الإدارة المحدثة",
      },
      ai_module: {
        label: "الذكاء الاصطناعي",
        default: true,
        description: "تفعيل وحدة الذكاء الاصطناعي",
      },
      client_portal: {
        label: "بوابة العميل",
        default: true,
        description: "تفعيل بوابة العملاء",
      },
      automation_rules: {
        label: "قواعد الأتمتة",
        default: true,
        description: "تفعيل قواعد أتمتة العملاء المحتملين",
      },
      notifications: {
        label: "الإشعارات",
        default: true,
        description: "تفعيل نظام الإشعارات",
      },
      public_registration: {
        label: "التسجيل العام",
        default: false,
        description: "السماح بتسجيل حسابات جديدة للعملاء",
      },
    };
  }
}
