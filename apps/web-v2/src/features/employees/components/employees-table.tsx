import Link from "next/link";

import { StatusBadge } from "@/components/patterns/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmployeeAdminRecord } from "@/features/employees/lib/employee-admin";
import {
  getDepartmentLabel,
  getRoleLabel,
} from "@/features/employees/lib/employee-admin";

type EmployeesTableProps = {
  rows: EmployeeAdminRecord[];
  onEdit: (employee: EmployeeAdminRecord) => void;
  onToggleSuspend: (employeeId: string) => void;
};

export function EmployeesTable({
  rows,
  onEdit,
  onToggleSuspend,
}: EmployeesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Profile</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead>State</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <Link
                href={`/admin/employees/${employee.id}`}
                className="flex items-center gap-3"
              >
                <Avatar>
                  <AvatarFallback>{employee.initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium hover:underline">
                    {employee.name}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {employee.email}
                  </span>
                </div>
              </Link>
            </TableCell>
            <TableCell>{getRoleLabel(employee.role)}</TableCell>
            <TableCell>{getDepartmentLabel(employee.department)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {employee.lastSeen}
            </TableCell>
            <TableCell>
              <StatusBadge tone={employee.isActive ? "success" : "destructive"}>
                {employee.isActive ? "Active" : "Suspended"}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(employee)}>
                  Edit
                </Button>
                <Button
                  variant={employee.isActive ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => onToggleSuspend(employee.id)}
                >
                  {employee.isActive ? "Suspend" : "Reactivate"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
