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
import { AdminStatusBadge } from "@/components/dashboard/admin/shared/AdminStatusBadge";
import { useGetAdminProjectByIdQuery, useArchiveAdminProjectMutation, useUnarchiveAdminProjectMutation } from "@/features/admin/adminProjectsApi";
import { cn } from "@/lib/utils";

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

  const [archive] = useArchiveAdminProjectMutation();
  const [unarchive] = useUnarchiveAdminProjectMutation();

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
        await archive(id).unwrap();
      } else if (actionModal.type === "unarchive") {
        await unarchive(id).unwrap();
      }
    } catch { /* best-effort */ }
    setActionModal(null);
    setReason("");
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
    <div className="space-y-6" dir="rtl">
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
        {project.isArchived ? (
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
        )}
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
            placeholder="سبب الإجراء (مطلوب)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[96px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReason("")}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={!reason.trim()}>
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
            placeholder="سبب الإجراء (مطلوب)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[96px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReason("")}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={!reason.trim()}>
              إلغاء الأرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
