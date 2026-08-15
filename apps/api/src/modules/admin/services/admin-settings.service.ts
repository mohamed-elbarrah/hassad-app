import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  /** Get all company settings as a flat key-value object */
  async getAll() {
    const settings = await this.prisma.companySetting.findMany();
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  /** Get a single setting by key */
  async get(key: string) {
    const setting = await this.prisma.companySetting.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }

  /** Batch update settings. Accepts { key: value, ... } */
  async updateBatch(updates: Record<string, any>) {
    const results: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
      const setting = await this.prisma.companySetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
      results[key] = setting.value;
    }

    return results;
  }

  /** Default settings to seed if none exist */
  async ensureDefaults() {
    const defaults: Record<string, any> = {
      companyName: "Hassad",
      companyNameEn: "Hassad",
      supportEmail: "support@hassad.sa",
      supportPhone: "+966500000000",
      defaultCurrency: "SAR",
      timezone: "Asia/Riyadh",
      dateFormat: "DD/MM/YYYY",
      language: "en",
      invoicePrefix: "INV",
      lowBalanceAlert: 5000,
      autoArchiveDays: 90,
    };

    for (const [key, value] of Object.entries(defaults)) {
      await this.prisma.companySetting.upsert({
        where: { key },
        create: { key, value },
        update: {},
      });
    }

    return this.getAll();
  }
}
