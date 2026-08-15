import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OverviewAmount } from "@/features/admin-overview/components/overview-amount";
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
import { useTranslations } from "@/lib/i18n";

type OverviewSalesLeaderboardProps = {
  rows: AdminOverviewSnapshot["salesLeaders"];
  periodLabel: string;
};

export function OverviewSalesLeaderboard({
  rows,
  periodLabel,
}: OverviewSalesLeaderboardProps) {
  const { locale, t } = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topSalesManagers")}</CardTitle>
        <CardDescription>
          {t("topSalesManagersDescription", { period: periodLabel.toLowerCase() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("manager")}</TableHead>
              <TableHead className="text-right">{t("deals")}</TableHead>
              <TableHead className="text-right">{t("contracts")}</TableHead>
              <TableHead className="text-right">{t("revenue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{row.initials}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{row.deals}</TableCell>
                <TableCell className="text-right font-medium">{row.contracts}</TableCell>
                <TableCell className="text-right font-medium"><OverviewAmount value={row.revenue} locale={locale} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
