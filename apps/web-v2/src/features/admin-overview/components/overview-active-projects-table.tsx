import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type OverviewActiveProjectsTableProps = {
  rows: AdminOverviewSnapshot["activeProjects"];
  periodLabel: string;
};

export function OverviewActiveProjectsTable({
  rows,
  periodLabel,
}: OverviewActiveProjectsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active projects</CardTitle>
        <CardDescription>
          Delivery state and workload across {periodLabel.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>PM</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium">{row.name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {row.clientName} • {row.value}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge tone={row.stateTone}>{row.state}</StatusBadge>
                </TableCell>
                <TableCell className="font-medium">{row.progress}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <AvatarFallback>{row.pmInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{row.pm}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.activeTasks}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
