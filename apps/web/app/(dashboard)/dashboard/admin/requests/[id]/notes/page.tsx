"use client";

import { use } from "react";
import { FileText, StickyNote, Package } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { useGetAdminRequestByIdQuery } from "@/features/admin/adminRequestsApi";

export default function RequestNotesTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: request } = useGetAdminRequestByIdQuery(id);

  if (!request) return null;

  return (
    <div className="space-y-5" dir="rtl">
      <SurfaceCard title="الملاحظات">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
          <StickyNote className="h-5 w-5 text-secondary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-portal-note-text mb-1">ملاحظات العميل</p>
            <p className="text-sm font-medium text-natural-100 whitespace-pre-wrap">
              {request.notes || "لا توجد ملاحظات"}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="ملاحظات داخلية">
        <div className="flex items-start gap-3 p-4 rounded-xl border border-portal-card-border">
          <FileText className="h-5 w-5 text-secondary-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-portal-note-text mb-1">
              ملاحظات الفريق الداخلي
            </p>
            <p className="text-sm font-medium text-natural-100 whitespace-pre-wrap">
              {request.internalNotes || "لا توجد ملاحظات داخلية"}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="تفاصيل الخدمات">
        {request.services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-portal-note-text mb-3" />
            <p className="text-sm text-portal-note-text">
              لا توجد خدمات مضافة لهذا الطلب.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {request.services.map((svc, idx) => (
              <div
                key={svc.id}
                className="p-4 rounded-xl border border-portal-card-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-natural-100">
                    {svc.serviceId}
                  </p>
                  <span className="text-xs text-portal-note-text">
                    الكمية: {svc.quantity}
                  </span>
                </div>
                {svc.notes && (
                  <p className="text-xs text-portal-note-text mt-1">
                    {svc.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
