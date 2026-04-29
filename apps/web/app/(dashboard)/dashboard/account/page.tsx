"use client";

import { useAppSelector } from "@/lib/hooks";
import { UserRole, TaskDepartment } from "@hassad/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Briefcase } from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "مدير النظام",
  [UserRole.PM]: "مدير المشاريع",
  [UserRole.SALES]: "المبيعات",
  [UserRole.ACCOUNTANT]: "المحاسبة",
  [UserRole.MARKETING]: "التسويق",
  [UserRole.EMPLOYEE]: "موظف",
  [UserRole.CLIENT]: "عميل",
};

const DEPT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "التصميم",
  [TaskDepartment.MARKETING]: "التسويق",
  [TaskDepartment.DEVELOPMENT]: "التطوير",
  [TaskDepartment.CONTENT]: "المحتوى",
  [TaskDepartment.PRODUCTION]: "المونتاج",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function AccountPage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const deptLabel = user.department
    ? (DEPT_LABELS[user.department as TaskDepartment] ?? user.department)
    : null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">الحساب الشخصي</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarFallback className="rounded-xl text-lg font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{roleLabel}</Badge>
              {deptLabel && <Badge variant="outline">{deptLabel}</Badge>}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">
                الاسم الكامل
              </p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">
                البريد الإلكتروني
              </p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {deptLabel && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">القسم</p>
                <p className="font-medium">{deptLabel}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
