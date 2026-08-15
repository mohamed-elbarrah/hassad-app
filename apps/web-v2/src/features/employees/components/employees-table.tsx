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
import { translateEmployeeLabel, useTranslations } from "@/lib/i18n";

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
  const { locale, t } = useTranslations();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("profile")}</TableHead>
          <TableHead>{t("role")}</TableHead>
          <TableHead>{t("department")}</TableHead>
          <TableHead>{t("lastSeen")}</TableHead>
          <TableHead>{t("state")}</TableHead>
          <TableHead className="text-right">{t("actions")}</TableHead>
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
            <TableCell>{translateEmployeeLabel(locale, getRoleLabel(employee.role))}</TableCell>
            <TableCell>{translateEmployeeLabel(locale, getDepartmentLabel(employee.department))}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {translateEmployeeLabel(locale, employee.lastSeen)}
            </TableCell>
            <TableCell>
              <StatusBadge tone={employee.isActive ? "success" : "destructive"}>
                {employee.isActive ? t("activeStatus") : t("suspendedStatus")}
              </StatusBadge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(employee)}>
                  {t("edit")}
                </Button>
                <Button
                  variant={employee.isActive ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => onToggleSuspend(employee.id)}
                >
                  {employee.isActive ? t("suspend") : t("reactivate")}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
