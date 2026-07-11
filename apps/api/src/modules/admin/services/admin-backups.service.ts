import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class AdminBackupsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(type: string) {
    switch (type) {
      case "users": {
        const users = await this.prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        });
        return this.toCsv(users, [
          "id",
          "name",
          "email",
          "isActive",
          "createdAt",
        ]);
      }
      case "clients": {
        const clients = await this.prisma.client.findMany({
          select: {
            id: true,
            companyName: true,
            businessName: true,
            user: {
              select: {
                name: true,
                email: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        });
        return this.toCsv(
          clients.map((c) => ({
            id: c.id,
            name: c.user?.name ?? "",
            email: c.user?.email ?? "",
            companyName: c.companyName ?? c.businessName ?? "",
            isActive: c.user?.isActive ?? false,
            createdAt: c.user?.createdAt ?? "",
          })),
          ["id", "name", "email", "companyName", "isActive", "createdAt"],
        );
      }
      case "invoices": {
        const invoices = await this.prisma.invoice.findMany({
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
            createdAt: true,
            client: { select: { companyName: true } },
          },
        });
        return this.toCsv(
          invoices.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            client: i.client?.companyName ?? "",
            amount: i.amount,
            status: i.status,
            dueDate: i.dueDate,
            createdAt: i.createdAt,
          })),
          [
            "id",
            "invoiceNumber",
            "client",
            "amount",
            "status",
            "dueDate",
            "createdAt",
          ],
        );
      }
      case "audit-log": {
        const logs = await this.prisma.ledger.findMany({
          take: 1000,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            entity: true,
            entityId: true,
            userId: true,
            createdAt: true,
          },
        });
        return this.toCsv(logs, [
          "id",
          "action",
          "entity",
          "entityId",
          "userId",
          "createdAt",
        ]);
      }
      default:
        throw new BadRequestException(
          `نوع التصدير "${type}" غير مدعوم. الأنواع المدعومة: users, clients, invoices, audit-log`,
        );
    }
  }

  private toCsv(data: Record<string, any>[], fields: string[]): string {
    const header = fields.join(",");
    const rows = data.map((row) =>
      fields
        .map((f) => {
          const val = row[f];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    );
    return "\uFEFF" + [header, ...rows].join("\n");
  }
}
