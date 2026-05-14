"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ExternalLink, Search, Calendar } from "lucide-react";
import { useGetPortalContractsQuery } from "@/features/portal/portalApi";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { PortalPagination } from "@/components/portal/PortalPagination";
import { PortalDataTable } from "@/components/portal/PortalDataTable";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  } = useGetPortalContractsQuery({
    page,
    limit: 10,
    search,
    dateFrom: dateRange.from?.toISOString(),
    dateTo: dateRange.to?.toISOString(),
  });

  const contracts = contractsData?.data ?? [];
  const totalPages = Math.ceil((contractsData?.total ?? 0) / 10);

  const searchBar = (
    <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-portal-card-border bg-natural-0 px-3 py-2 w-full max-w-md">
      <Search className="h-4 w-4 text-portal-icon" />
      <Input
        placeholder="البحث..."
        className="border-none focus-visible:ring-0 text-sm bg-transparent h-8"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="العقود"
        description="استعرض جميع عقودك الحالية، حالة كل عقد، القيمة، وتواريخ البدء والانتهاء."
        icon={FileText}
      />

      <PortalSurfaceCard
        title="قائمة العقود"
        description="جميع عقودك قيد الإدارة والتوقيع"
        icon={FileText}
        action={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-2xl border-[1.5px] border-portal-card-border bg-white px-4 text-sm font-medium text-portal-icon hover:bg-badge-gray-bg gap-2"
              >
                <Calendar className="h-4 w-4" />
                {dateRange.from
                  ? `${format(dateRange.from, "dd MMM yyyy", { locale: ar })} - ${dateRange.to ? format(dateRange.to, "dd MMM yyyy", { locale: ar }) : "اليوم"}`
                  : "اختر التاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 flex flex-col gap-2">
                <span className="text-xs font-medium text-natural-100">
                  تحديد الفترة
                </span>
                <div className="flex gap-2">
                  <Button
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
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDateRange({ from: new Date(), to: new Date() })
                    }
                  >
                    اليوم
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        }
      >
        <div className="mb-3">{searchBar}</div>

        <PortalDataTable
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl border border-portal-card-border bg-white px-3 text-xs font-medium text-portal-icon hover:bg-badge-gray-bg hover:text-secondary-500 gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {contract.status === "SENT"
                      ? "توقيع العقد"
                      : "استعراض العقد"}
                  </Button>
                </Link>
              </td>
            </tr>
          )}
        />

        {!isLoading && !isError && contracts.length > 0 && (
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
