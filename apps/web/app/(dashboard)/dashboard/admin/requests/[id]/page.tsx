"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, FileText, FolderKanban, StickyNote } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Skeleton } from "@/components/design-system/Skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/design-system/Tabs";
import { DataTable } from "@/components/design-system/DataTable";
import { useGetAdminRequestQuery, useUpdateRequestNotesMutation } from "@/features/admin/adminApi";
import { REQUEST_STATUS_AR } from "@hassad/shared";

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: req, isLoading } = useGetAdminRequestQuery(id);
  const [updateNotes, { isLoading: saving }] = useUpdateRequestNotesMutation();
  const [notes, setNotes] = useState("");

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 p-6" dir="rtl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  if (!req)
    return (
      <div className="p-6 text-center text-portal-note-text" dir="rtl">
        الطلب غير موجود
      </div>
    );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro
        title={`طلب #${req.id.slice(0, 8)}`}
        description={`${req.client?.companyName ?? "—"} · ${REQUEST_STATUS_AR[req.status] ?? req.status}`}
        icon={ClipboardList}
        actions={
          <ActionButton
            variant="outline"
            size="md"
            onClick={() => router.back()}
          >
            <ArrowRight className="size-4 ml-1" />
            العودة
          </ActionButton>
        }
      />

      <SurfaceCard>
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="w-full justify-start gap-1 px-4 pt-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="services">الخدمات</TabsTrigger>
            <TabsTrigger value="history">سجل الحالة</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      العميل
                    </span>
                    <p className="text-base font-medium">
                      {req.client?.companyName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      المسؤول
                    </span>
                    <p className="text-base font-medium">
                      {req.assignee?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">
                      الحالة
                    </span>
                    <div className="mt-1">
                      <StatusBadge
                        status={req.status}
                        label={REQUEST_STATUS_AR[req.status] ?? req.status}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-portal-note-text">
                      تاريخ الإنشاء
                    </span>
                    <p className="text-base font-medium">
                      {req.createdAt?.slice(0, 10) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-portal-note-text">الوصف</span>
                    <p className="text-base font-medium">
                      {req.description ?? "—"}
                    </p>
                  </div>
                  {req.proposal && (
                    <div>
                      <span className="text-sm text-portal-note-text">العرض الفني المرتبط</span>
                      <button
                        onClick={() => router.push(`/dashboard/admin/proposals/${req.proposal.id}`)}
                        className="flex items-center gap-2 text-base font-medium text-secondary-600 hover:text-secondary-700 transition-colors"
                      >
                        <FileText className="size-4" />
                        {req.proposal.title ?? req.proposal.id.slice(0, 8)}
                      </button>
                    </div>
                  )}
                  {req.project && (
                    <div>
                      <span className="text-sm text-portal-note-text">المشروع الناتج</span>
                      <button
                        onClick={() => router.push(`/dashboard/admin/projects/${req.project.id}`)}
                        className="flex items-center gap-2 text-base font-medium text-secondary-600 hover:text-secondary-700 transition-colors"
                      >
                        <FolderKanban className="size-4" />
                        {req.project.name ?? req.project.id.slice(0, 8)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <hr className="my-6 border-portal-divider" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-portal-note-text">
                  <StickyNote className="size-4" />
                  ملاحظات داخلية
                </div>
                <textarea
                  value={notes || req.internalNotes || ""}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="لا توجد ملاحظات حالياً"
                  className="w-full min-h-[100px] rounded-xl border border-portal-divider bg-transparent px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-secondary-500"
                  dir="rtl"
                />
                <div className="flex justify-end">
                  <ActionButton
                    size="sm"
                    onClick={async () => {
                      await updateNotes({ id, notes: notes || req.internalNotes || "" }).unwrap();
                    }}
                    disabled={saving}
                  >
                    {saving ? "جاري الحفظ..." : "حفظ الملاحظات"}
                  </ActionButton>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="services">
              <DataTable
                columns={[
                  { id: "service", label: "الخدمة" },
                  { id: "qty", label: "الكمية" },
                ]}
                data={req.services ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: ClipboardList,
                  message: "لا توجد خدمات",
                  hint: "لم يتم إضافة خدمات لهذا الطلب",
                }}
                renderRow={(s: any) => (
                  <tr key={s.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm font-medium">
                      {s.service?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">{s.quantity ?? 1}</td>
                  </tr>
                )}
              />
            </TabsContent>
            <TabsContent value="history">
              <DataTable
                columns={[
                  { id: "from", label: "من" },
                  { id: "to", label: "إلى" },
                  { id: "note", label: "ملاحظة" },
                  { id: "date", label: "التاريخ", align: "left" },
                ]}
                data={req.statusHistory ?? []}
                isLoading={false}
                isError={false}
                emptyState={{
                  icon: ClipboardList,
                  message: "لا يوجد سجل",
                  hint: "لم يتم تسجيل تغييرات في الحالة",
                }}
                renderRow={(h: any) => (
                  <tr key={h.id} className="border-b border-portal-divider">
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge status={h.fromStatus} label={h.fromStatus} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusBadge status={h.toStatus} label={h.toStatus} />
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text">
                      {h.note ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-portal-note-text text-left">
                      {h.changedAt?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SurfaceCard>
    </div>
  );
}
