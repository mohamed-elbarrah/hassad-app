"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, Search, Calendar } from "lucide-react";
import { useGetPortalContractsQuery } from "@/features/portal/portalApi";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { Pagination } from "@/components/design-system/Pagination";
import { DataTable } from "@/components/design-system/DataTable";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Input } from "@/components/design-system/Input";
import { Popover } from "@/components/design-system/Popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { mapContractStatusToUI } from "@/lib/utils/statusMapping";

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

export default function PortalContractsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const {
    data: contractsData,
    isLoading,
    isError,
  } = useGetPortalContractsQuery(
    {
      page,
      limit: 10,
      search,
      dateFrom: dateRange.from?.toISOString(),
      dateTo: dateRange.to?.toISOString(),
    },
    { pollingInterval: 120_000 },
  );

  const contracts = contractsData?.data ?? [];
  const totalPages = Math.ceil((contractsData?.total ?? 0) / 10);

  const searchBar = (
    <Input
      icon={<Search className="h-4 w-4 text-portal-icon" />}
      placeholder="البحث..."
      className="h-8"
      wrapperClassName="w-full max-w-md"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
    />
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PageIntro
        title="العقود"
        description="استعرض جميع عقودك الحالية، حالة كل عقد، القيمة، وتواريخ البدء والانتهاء."
        icon={FileText}
      />

      <SurfaceCard
        title="قائمة العقود"
        description="جميع عقودك قيد الإدارة والتوقيع"
        icon={FileText}
        action={
          <Popover
            trigger={
              <ActionButton
                variant="ghost"
                size="sm"
                className="h-10 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-4 text-sm font-medium text-portal-icon hover:bg-badge-gray-bg gap-2"
              >
                <Calendar className="h-4 w-4" />
                {dateRange.from
                  ? `${format(dateRange.from, "dd MMM yyyy", { locale: ar })} - ${dateRange.to ? format(dateRange.to, "dd MMM yyyy", { locale: ar }) : "اليوم"}`
                  : "اختر التاريخ"}
              </ActionButton>
            }
            align="start"
            contentClassName="w-auto p-0"
          >
            <div className="p-3 flex flex-col gap-2">
              <span className="text-xs font-medium text-natural-100">
                تحديد الفترة
              </span>
              <div className="flex gap-2">
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      from: new Date(
                        new Date().setDate(new Date().getDate() - 7),
                      ),
                      to: new Date(),
                    })
                  }
                >
                  آخر 7 أيام
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDateRange({ from: new Date(), to: new Date() })
                  }
                >
                  اليوم
                </ActionButton>
              </div>
            </div>
          </Popover>
        }
      >
        <div className="mb-3">{searchBar}</div>

        <DataTable
          columns={[
            { id: "title", label: "العقد" },
            { id: "type", label: "النوع" },
            { id: "value", label: "القيمة" },
            { id: "status", label: "الحالة" },
            { id: "manager", label: "مدير المشروع" },
            { id: "action", label: "الإجراء" },
          ]}
          data={contracts}
          isLoading={isLoading}
          isError={isError}
          errorMessage="حدث خطأ أثناء تحميل العقود."
          emptyState={{
            icon: FileText,
            message: "لا توجد عقود متاحة حالياً.",
            hint: "ستظهر هنا جميع العقود المرتبطة بحسابك بمجرد إنشائها.",
          }}
          renderRow={(contract: any) => (
            <tr
              key={contract.id}
              className="border-b-[1.5px] border-portal-divider"
            >
              <td className="px-5 py-4 font-medium text-sm text-natural-100">
                {contract.title}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {TYPE_LABELS[contract.type] ?? contract.type}
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {fmt(contract.totalValue)} ر.س
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={mapContractStatusToUI(contract.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-portal-note-text">
                {contract.projectManager || "غير معين"}
              </td>
              <td className="px-5 py-4">
                <Link href={`/portal/contracts/${contract.id}`}>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl border border-portal-card-border bg-white px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {contract.status === "SENT"
                      ? "توقيع العقد"
                      : "استعراض العقد"}
                  </ActionButton>
                </Link>
              </td>
            </tr>
          )}
        />

        {!isLoading && !isError && contracts.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </SurfaceCard>
    </div>
  );
}
