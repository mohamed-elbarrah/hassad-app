"use client";

import { useAppSelector } from "@/lib/hooks";
import { UserRole, TaskDepartment } from "@hassad/shared";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pill } from "@/components/design-system/Pill";
import { UserAvatar } from "@/components/design-system/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/design-system/Skeleton";
import { User, Mail, Briefcase } from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "مدير النظام",
  [UserRole.PM]: "مدير المشاريع",
  [UserRole.SALES]: "المبيعات",
  [UserRole.ACCOUNTANT]: "المحاسبة",
  [UserRole.MARKETING]: "التسويق",
  [UserRole.TEAM]: "فريق",
  [UserRole.CLIENT]: "عميل",
};

const DEPT_LABELS: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "التصميم",
  [TaskDepartment.MARKETING]: "التسويق",
  [TaskDepartment.DEVELOPMENT]: "التطوير",
  [TaskDepartment.CONTENT]: "المحتوى",
  [TaskDepartment.PRODUCTION]: "المونتاج",
};

export default function AccountPage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const deptLabel = user.department
    ? (DEPT_LABELS[user.department as TaskDepartment] ?? user.department)
    : null;

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">الحساب الشخصي</h1>

      <SurfaceCard>
        <div className="flex flex-row items-center gap-4 pb-4">
          <UserAvatar name={user.name} size="lg" variant="rounded" />
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-natural-100">
              {user.name}
            </h2>
            <div className="flex items-center gap-2">
              <Pill tone="neutral">{roleLabel}</Pill>
              {deptLabel && <Pill tone="blue">{deptLabel}</Pill>}
            </div>
          </div>
        </div>

        <Separator />

        <div className="pt-4 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-neutral-300 shrink-0" />
            <div>
              <p className="text-neutral-300 text-xs mb-0.5">الاسم الكامل</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-neutral-300 shrink-0" />
            <div>
              <p className="text-neutral-300 text-xs mb-0.5">
                البريد الإلكتروني
              </p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {deptLabel && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-neutral-300 shrink-0" />
              <div>
                <p className="text-neutral-300 text-xs mb-0.5">القسم</p>
                <p className="font-medium">{deptLabel}</p>
              </div>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
