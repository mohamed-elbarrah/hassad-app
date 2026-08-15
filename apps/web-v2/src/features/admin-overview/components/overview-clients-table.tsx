import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminOverviewSnapshot } from "@/features/admin-overview/lib/admin-overview-data";
import { StatusBadge } from "@/components/patterns/status-badge";
import { translateAdminOverviewText, useTranslations } from "@/lib/i18n";

type OverviewClientsTableProps = {
  rows: AdminOverviewSnapshot["clients"];
  periodLabel: string;
};

export function OverviewClientsTable({
  rows,
  periodLabel,
}: OverviewClientsTableProps) {
  const { locale, t } = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("clients")}</CardTitle>
        <CardDescription>
          {t("clientsDescription", { period: periodLabel.toLowerCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("client")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              <TableHead className="text-right">{t("active")}</TableHead>
              <TableHead>{t("lastSeen")}</TableHead>
              <TableHead className="text-right">{t("balance")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{row.clientName}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {row.companyName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.totalProjects}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.activeProjects}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={row.onlineTone}>{translateAdminOverviewText(locale, row.lastSeen)}</StatusBadge>
                </TableCell>
                <TableCell className="text-right font-medium">{row.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
