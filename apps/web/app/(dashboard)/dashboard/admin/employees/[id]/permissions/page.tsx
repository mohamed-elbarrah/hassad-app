"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useGetAdminUserPermissionsQuery, useUpdateAdminUserPermissionsMutation } from "@/features/admin/adminUsersApi";
import { adminErrorMessage } from "@/lib/i18n";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "sonner";

export default function EmployeePermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, error, refetch } = useGetAdminUserPermissionsQuery(id);
  const [updatePermissions, { isLoading: isSaving }] = useUpdateAdminUserPermissionsMutation();
  const [selection, setSelection] = useState<{ userId: string; permissionIds: string[] } | null>(null);
  const [writeDeniedFor, setWriteDeniedFor] = useState<string | null>(null);
  const writeDenied = writeDeniedFor === id;
  const selectedPermissionIds = selection?.userId === id
    ? selection.permissionIds
    : data?.assignedPermissionIds ?? [];
  const assignablePermissionIds = data?.canAssignPermissionIds ?? [];
  const canManagePermissions = assignablePermissionIds.length > 0;

  function toggle(permissionId: string, checked: boolean) {
    setSelection((current) => {
      const currentIds = current?.userId === id
        ? current.permissionIds
        : data?.assignedPermissionIds ?? [];
      const permissionIds = checked
        ? [...new Set([...currentIds, permissionId])]
        : currentIds.filter((currentId) => currentId !== permissionId);
      return { userId: id, permissionIds };
    });
  }

  async function save() {
    try {
      await updatePermissions({ id, permissionIds: selectedPermissionIds }).unwrap();
      toast.success("تم حفظ الصلاحيات");
    } catch (mutationError) {
      if (getErrorCode(mutationError) === "PERMISSION_DENIED") {
        setWriteDeniedFor(id);
      }
      toast.error(adminErrorMessage(mutationError));
    }
  }

  if (isLoading) return <AdminDetailSkeleton />;
  if (isError || !data) {
    const permissionDenied = getErrorCode(error) === "PERMISSION_DENIED";
    return <div className="flex flex-col gap-6" dir="rtl"><Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><ShieldCheck /></EmptyMedia><EmptyHeader><EmptyTitle>تعذر تحميل الصلاحيات</EmptyTitle><EmptyDescription>{adminErrorMessage(error)}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" asChild><Link href={`/dashboard/admin/employees/${id}`}><ArrowLeft data-icon="inline-start" />العودة للتفاصيل</Link></Button>{!permissionDenied ? <Button onClick={() => refetch()}>إعادة المحاولة</Button> : null}</EmptyContent></Empty></CardContent></Card></div>;
  }

  return <div className="flex flex-col gap-6" dir="rtl">
    <PageHeader title="صلاحيات الموظف" description="إدارة الصلاحيات المباشرة لهذا الموظف." icon={ShieldCheck} actions={<Button variant="outline" asChild><Link href={`/dashboard/admin/employees/${id}`}><ArrowLeft data-icon="inline-start" />العودة للتفاصيل</Link></Button>} />
    <Card><CardHeader className="gap-2"><CardTitle>الصلاحيات المتاحة</CardTitle><CardDescription>الصلاحيات المحددة تطبق مباشرة على حساب الموظف.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="grid gap-3 md:grid-cols-2">{data.permissions.map((permission) => { const isAssigned = selectedPermissionIds.includes(permission.id); const canEdit = assignablePermissionIds.includes(permission.id); return <label key={permission.id} htmlFor={`permission-${permission.id}`} className="flex min-h-11 items-center gap-3 rounded-md border p-3"><Checkbox id={`permission-${permission.id}`} aria-label={permission.name} checked={isAssigned} disabled={!canEdit} onCheckedChange={(checked) => toggle(permission.id, checked === true)} /><span dir="ltr" className="text-sm">{permission.name}</span></label>; })}</div><div className="flex flex-col items-start gap-2">{canManagePermissions && !writeDenied ? <Button onClick={save} disabled={isSaving}>{isSaving ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}</Button> : null}{!canManagePermissions || writeDenied ? <p className="text-sm text-muted-foreground">لا تملك صلاحية تعديل صلاحيات هذا الموظف.</p> : null}</div></CardContent></Card>
  </div>;
}

function getErrorCode(error: unknown): string | undefined {
  return (error as { data?: { error?: { code?: string } } })?.data?.error?.code;
}
