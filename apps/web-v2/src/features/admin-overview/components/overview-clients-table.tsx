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

type OverviewClientsTableProps = {
  rows: AdminOverviewSnapshot["clients"];
  periodLabel: string;
};

export function OverviewClientsTable({
  rows,
  periodLabel,
}: OverviewClientsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>
          Client portfolio activity in {periodLabel.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="text-right">Balance</TableHead>
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
                  <StatusBadge tone={row.onlineTone}>{row.lastSeen}</StatusBadge>
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
