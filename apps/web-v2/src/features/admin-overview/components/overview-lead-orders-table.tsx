import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { AdminOverviewSnapshot } from "@/features/admin-overview/lib/admin-overview-data";

type OverviewLeadOrdersTableProps = {
  rows: AdminOverviewSnapshot["leadOrders"];
  periodLabel: string;
};

export function OverviewLeadOrdersTable({
  rows,
  periodLabel,
}: OverviewLeadOrdersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads and orders</CardTitle>
        <CardDescription>
          Active CRM opportunities and follow-up quality in {periodLabel.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Meetings</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Next action</TableHead>
              <TableHead className="text-right">Value</TableHead>
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
                  <StatusBadge tone={row.stageTone}>{formatOrderStage(row.crmStage ?? row.stage)}</StatusBadge>
                </TableCell>
                <TableCell>{row.calls}</TableCell>
                <TableCell>{row.meetings}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <StatusBadge tone={row.projectsTone}>{row.projects}</StatusBadge>
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
                  <span className="text-sm text-muted-foreground">{row.nextAction}</span>
                </TableCell>
                <TableCell className="text-right font-medium">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
