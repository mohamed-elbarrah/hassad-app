"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminDetailBreadcrumb } from "@/components/dashboard/admin/shared/AdminDetailBreadcrumb";
import { AdminDetailSkeleton } from "@/components/dashboard/admin/shared/AdminDetailSkeleton";
import { AdminDetailError } from "@/components/dashboard/admin/shared/AdminDetailError";
import { ErrorState } from "@/components/design-system/EmptyState";
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import {
  useGetAdminProjectActorCapabilitiesQuery,
  useGetAdminProjectByIdQuery,
  useArchiveAdminProjectMutation,
  useUnarchiveAdminProjectMutation,
} from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";

const TABS = [
  { key: "", label: "الملخص" },
  { key: "/timeline", label: "التسلسل الزمني" },
  { key: "/periods", label: "الفترات" },
  { key: "/tasks", label: "المهام" },
  { key: "/deliverables", label: "التسليمات" },
  { key: "/team", label: "الفريق" },
  { key: "/finance", label: "المالية" },
];

export default function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const {
    data: project,
    isLoading,
    isError,
    refetch,
  } = useGetAdminProjectByIdQuery(id);

  const {
    data: capabilities,
    error: capabilitiesError,
    isError: isCapabilitiesError,
    refetch: refetchCapabilities,
  } = useGetAdminProjectActorCapabilitiesQuery();
  const canIntervene = capabilities?.canIntervene === true;

  const [archive, { isLoading: isArchiving }] = useArchiveAdminProjectMutation();
  const [unarchive, { isLoading: isUnarchiving }] = useUnarchiveAdminProjectMutation();

  const [actionModal, setActionModal] = useState<{
    type: "archive" | "unarchive";
  } | null>(null);
  const [reason, setReason] = useState("");

  const currentTab = useMemo(() => {
    for (const tab of TABS) {
      if (pathname.endsWith(`/projects/${id}${tab.key}`)) return tab.key;
    }
    return "";
  }, [pathname, id]);

  const handleAction = async () => {
    if (!actionModal || !reason.trim()) return;
    try {
      if (actionModal.type === "archive") {
        await archive({ id, reason: reason.trim() }).unwrap();
      } else {
        await unarchive({ id, reason: reason.trim() }).unwrap();
      }
      toast.success(adminSuccessMessage("PROJECT_ACTION_COMPLETED"));
      setActionModal(null);
      setReason("");
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  };

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !project) {
    return (
      <AdminDetailError
        onRetry={refetch}
        backHref="/dashboard/admin/projects"
        backLabel="المشاريع"
        title="حدث خطأ أثناء تحميل بيانات المشروع"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <AdminDetailBreadcrumb
          backHref="/dashboard/admin/projects"
          backLabel="المشاريع"
          title={project.name}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {project.client.companyName}
          </span>
          <AdminStatusBadge domain="project" status={project.status} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/admin/clients/${project.client.id}`}>
            عرض العميل
          </Link>
        </Button>
        {project.contractId && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/contracts/${project.contractId}`}>
              عرض العقد
            </Link>
          </Button>
        )}
        {isCapabilitiesError ? (
          <ErrorState
            title="تعذّر تحميل صلاحيات الإدارة"
            message={adminErrorMessage(capabilitiesError)}
            onRetry={() => refetchCapabilities()}
            className="min-h-0 flex-row gap-2 rounded-md border-0 bg-transparent p-0"
          />
        ) : canIntervene ? project.isArchived ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActionModal({ type: "unarchive" })}
          >
            إلغاء الأرشفة
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActionModal({ type: "archive" })}
          >
            أرشفة
          </Button>
        ) : null}
      </div>

      <Tabs value={currentTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
          {TABS.map((tab) => {
            const href = tab.key
              ? `/dashboard/admin/projects/${id}${tab.key}`
              : `/dashboard/admin/projects/${id}`;
            return (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                asChild
                className={cn(
                  "rounded-none border-b-2 px-4 pb-3 pt-0 text-sm font-medium data-[state=active]:shadow-none",
                  "data-[state=active]:border-primary data-[state=active]:text-primary",
                  "data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground",
                  "h-auto",
                )}
              >
                <Link href={href}>{tab.label}</Link>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <AlertDialog
        open={actionModal?.type === "archive"}
        onOpenChange={(open) => !open && setActionModal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>أرشفة المشروع</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم أرشفة المشروع. لن يظهر في القوائم النشطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            id="admin-project-archive-reason"
            placeholder="سبب الإجراء (مطلوب)"
            aria-label="سبب الإجراء"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[96px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReason("")}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={!reason.trim() || isArchiving || isUnarchiving}>
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={actionModal?.type === "unarchive"}
        onOpenChange={(open) => !open && setActionModal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء أرشفة المشروع</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إعادة المشروع إلى الحالة النشطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            id="admin-project-unarchive-reason"
            placeholder="سبب الإجراء (مطلوب)"
            aria-label="سبب الإجراء"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[96px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReason("")}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={!reason.trim() || isArchiving || isUnarchiving}>
              إلغاء الأرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
