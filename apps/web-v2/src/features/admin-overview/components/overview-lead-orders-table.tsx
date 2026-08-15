import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OverviewAmount } from "@/features/admin-overview/components/overview-amount";
import { formatOrderStage } from "@/features/crm-orders/lib/order-directory";
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
import { StatusBadge } from "@/components/patterns/status-badge";
import { Badge } from "@/components/ui/badge";
import type { AdminOverviewSnapshot } from "@/features/admin-overview/lib/admin-overview-data";
import { translateAdminOverviewText, useTranslations } from "@/lib/i18n";

type OverviewLeadOrdersTableProps = {
  rows: AdminOverviewSnapshot["leadOrders"];
  periodLabel: string;
};

export function OverviewLeadOrdersTable({
  rows,
  periodLabel,
}: OverviewLeadOrdersTableProps) {
  const { locale, t } = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("leadsAndOrders")}</CardTitle>
        <CardDescription>
          {t("leadsAndOrdersDescription", { period: periodLabel.toLowerCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("client")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("pipeline")}</TableHead>
              <TableHead>{t("calls")}</TableHead>
              <TableHead>{t("meetings")}</TableHead>
              <TableHead>{t("projects")}</TableHead>
              <TableHead>{t("owner")}</TableHead>
              <TableHead>{t("nextAction")}</TableHead>
              <TableHead className="text-right">{t("value")}</TableHead>
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
                <TableCell>
                  <Badge variant="outline">
                    {row.kind === "order" ? t("order") : t("lead")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={row.stageTone}>
                    {translateAdminOverviewText(locale, formatOrderStage(row.crmStage ?? row.stage))}
                  </StatusBadge>
                </TableCell>
                <TableCell>{row.calls}</TableCell>
                <TableCell>{row.meetings}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <StatusBadge tone={row.projectsTone}>
                      {translateAdminOverviewText(locale, row.projects)}
                    </StatusBadge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{row.ownerInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{row.owner}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {translateAdminOverviewText(locale, row.nextAction)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium"><OverviewAmount value={row.value} locale={locale} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
