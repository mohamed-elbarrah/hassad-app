"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { PortalPagination } from "@/components/portal/PortalPagination";
import { PortalFilterPills } from "@/components/portal/PortalFilterPills";
import { PortalPill } from "@/components/portal/PortalPill";
import { PortalDataTable } from "@/components/portal/PortalDataTable";
import { Button } from "@/components/ui/button";
import { useGetActionItemsQuery } from "@/features/portal/portalApi";

const TYPE_FILTERS = [
  { label: "الكل", value: "" },
  { label: "مراجعة تسليمات", value: "DELIVERABLE_APPROVAL" },
  { label: "دفع فواتير", value: "INVOICE_PAYMENT" },
  { label: "مراجعة عروض", value: "PROPOSAL_REVIEW" },
  { label: "توقيع عقود", value: "CONTRACT_SIGN" },
];

const TYPE_CONFIG: Record<string, { label: string; color: "purple" | "blue" }> =
  {
    DELIVERABLE_APPROVAL: { label: "مراجعة تسليم", color: "purple" },
    INVOICE_PAYMENT: { label: "دفع فاتورة", color: "blue" },
    PROPOSAL_REVIEW: { label: "مراجعة عرض", color: "purple" },
    CONTRACT_SIGN: { label: "توقيع عقد", color: "blue" },
  };

const PRIORITY_PILL: Record<
  string,
  { label: string; tone: "danger" | "neutral" | "warning" }
> = {
  high: { label: "عاجل", tone: "danger" },
  normal: { label: "عادي", tone: "neutral" },
  low: { label: "منخفض", tone: "warning" },
};

const PAGE_SIZE = 6;

export default function PortalActionsPage() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useGetActionItemsQuery({
    type: typeFilter || undefined,
    page,
    limit: PAGE_SIZE,
  }, { pollingInterval: 30_000 });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="إجراءات تتطلب تدخلك"
        description="جميع الإجراءات التي تحتاج مراجعتك أو موافقتك ضمن نفس تجربة العميل الموحدة."
        icon={CheckCircle2}
      />

      <PortalSurfaceCard
        title="الإجراءات المعلقة"
        description="راجع ما يتطلب تدخلك واتخذ الإجراء المناسب"
        icon={Settings}
        action={
          <PortalFilterPills
            options={TYPE_FILTERS}
            active={typeFilter}
            onChange={handleFilterChange}
          />
        }
      >
        <PortalDataTable
          columns={[
            { id: "title", label: "الإجراء" },
            { id: "subtitle", label: "التفاصيل" },
            { id: "priority", label: "الأولوية" },
            { id: "type", label: "النوع" },
            { id: "dueDate", label: "تاريخ الاستحقاق" },
            { id: "action", label: "الإجراء" },
          ]}
          data={items}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل الإجراءات."
          emptyState={{
            icon: Settings,
            message: "لا توجد إجراءات معلقة.",
            hint: "ستظهر هنا جميع الإجراءات التي تتطلب مراجعتك وموافقتك.",
          }}
          renderRow={(item) => {
            const config =
              TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DELIVERABLE_APPROVAL;
            const priorityCfg =
              PRIORITY_PILL[item.priority] ?? PRIORITY_PILL.normal;
            return (
              <tr
                key={item.id}
                className="border-b-[1.5px] border-portal-divider"
              >
                <td className="px-5 py-4 font-medium text-sm text-natural-100">
                  {item.title}
                </td>
                <td className="px-5 py-4 text-sm text-portal-note-text truncate max-w-[200px]">
                  {item.subtitle}
                </td>
                <td className="px-5 py-4">
                  <PortalPill tone={priorityCfg.tone}>
                    {priorityCfg.label}
                  </PortalPill>
                </td>
                <td className="px-5 py-4">
                  <PortalPill
                    tone={config.color === "purple" ? "purple" : "blue"}
                  >
                    {config.label}
                  </PortalPill>
                </td>
                <td className="px-5 py-4 text-sm text-portal-note-text">
                  {item.dueDate ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(item.dueDate).toLocaleDateString(
                          "ar-SA-u-nu-latn",
                        )}
                      </span>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-4">
                  <Button
                    size="sm"
                    onClick={() => router.push(item.actionUrl)}
                    className="h-9 rounded-xl bg-secondary-500 hover:bg-secondary-600 text-white px-3 text-xs font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    اتخاذ إجراء
                  </Button>
                </td>
              </tr>
            );
          }}
        />

        {!isLoading && !isError && items.length > 0 && (
          <PortalPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </PortalSurfaceCard>
    </div>
  );
}
