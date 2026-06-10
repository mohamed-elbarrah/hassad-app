"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  FileText,
  Download,
  DollarSign,
  Calendar,
  Receipt,
} from "lucide-react";
import { useGetContractByIdQuery } from "@/features/contracts/contractsApi";
import { ContractServicesTable } from "@/components/shared/ContractServicesTable";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBanner } from "@/components/design-system/StatusBanner";
import { Pill } from "@/components/design-system/Pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { formatShortDate } from "@/lib/format";
import { CurrencyDisplay } from "@/components/design-system/CurrencyDisplay";
import { ContractStatus } from "@hassad/shared";

interface PageProps {
  params: Promise<{ id: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "اشتراك شهري",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

const STATUS_META: Record<
  ContractStatus,
  { label: string; tone: import("@/components/design-system/Pill").PillTone }
> = {
  [ContractStatus.DRAFT]: { label: "مسودة", tone: "neutral" },
  [ContractStatus.SENT]: { label: "مرسل", tone: "warning" },
  [ContractStatus.SIGNED]: { label: "موقع", tone: "blue" },
  [ContractStatus.ACTIVE]: { label: "نشط", tone: "success" },
  [ContractStatus.EXPIRED]: { label: "منتهي", tone: "danger" },
  [ContractStatus.CANCELLED]: { label: "ملغى", tone: "danger" },
};

export default function SalesContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data, isLoading, isError } = useGetContractByIdQuery(id);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <Link href="/dashboard/sales/contracts">
          <ActionButton variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العقود
          </ActionButton>
        </Link>
        <SurfaceCard className="shadow-sm">
          <div className="pt-6 text-center text-danger-500 text-sm">
            العقد غير موجود.
          </div>
        </SurfaceCard>
      </div>
    );
  }

  const fileUrl = data.filePath ? buildPortalFileUrl(data.filePath) : null;
  const invoiceCount = data.invoices?.length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/sales/contracts">
          <ActionButton
            variant="ghost"
            size="sm"
            className="gap-1.5 text-neutral-300 hover:text-natural-100"
          >
            <ArrowRight className="h-4 w-4" />
            العقود
          </ActionButton>
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-medium truncate max-w-xs">
          {data.title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Pill tone={STATUS_META[data.status].tone} className="text-xs h-6 px-2">
              {STATUS_META[data.status].label}
            </Pill>
            <span className="text-xs text-neutral-300">
              {TYPE_LABELS[data.type] ?? data.type}
            </span>
          </div>
        </div>
        <p className="text-sm text-neutral-300">
          {data.client?.companyName}
          {data.client?.contactName ? ` — ${data.client.contactName}` : ""}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0"
        >
          <div>
            <p className="text-portal-note-text text-sm">القيمة الإجمالية</p>
            <h3 className="text-2xl font-bold mt-1">
              <CurrencyDisplay amount={data.totalValue} size="lg" />
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <DollarSign className="w-3 h-3 ml-1" />
            <span>{invoiceCount} فاتورة</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0"
        >
          <div>
            <p className="text-portal-note-text text-sm">الفترة</p>
            <h3 className="text-lg font-bold mt-1">
              {formatShortDate(data.startDate)} —{" "}
              {formatShortDate(data.endDate)}
            </h3>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <Calendar className="w-3 h-3 ml-1" />
            <span>مدة العقد</span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-0"
        >
          <div>
            <p className="text-portal-note-text text-sm">رابط التوقيع</p>
            <div className="mt-1">
              {data.shareLinkToken ? (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/contract/${data.shareLinkToken}`;
                    navigator.clipboard.writeText(url);
                  }}
                >
                  نسخ الرابط
                </ActionButton>
              ) : (
                <span className="text-sm text-neutral-300">غير متاح</span>
              )}
            </div>
          </div>
          <div className="flex items-center text-xs text-neutral-300 mt-3">
            <span>لإرساله للعميل</span>
          </div>
        </SurfaceCard>
      </div>

      {/* Services + Invoices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ContractServicesTable
          services={data.servicesList ?? []}
          totalValue={data.totalValue}
        />

        {/* Invoices */}
        <SurfaceCard
          title="الفواتير"
          description="الفواتير المرتبطة بهذا العقد"
          className="border-none shadow-sm"
        >
          {invoiceCount === 0 ? (
            <div className="text-center py-8 text-neutral-300 text-sm">
              لا توجد فواتير بعد.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices?.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="font-medium text-success-600">
                      <CurrencyDisplay amount={inv.amount} />
                    </TableCell>
                    <TableCell>
                      <Pill
                        tone={
                          inv.status === "PAID"
                            ? "success"
                            : inv.status === "LATE"
                              ? "danger"
                              : "warning"
                        }
                        className="text-[10px] h-5 px-2"
                      >
                        {inv.status === "PAID"
                          ? "مدفوعة"
                          : inv.status === "LATE"
                            ? "متأخرة"
                            : inv.status === "PENDING"
                              ? "معلقة"
                              : inv.status}
                      </Pill>
                    </TableCell>
                    <TableCell className="text-left">
                      <Link href={`/dashboard/finance/invoices/${inv.id}`}>
                        <ActionButton size="sm" variant="ghost">
                          <Receipt className="w-4 h-4" />
                        </ActionButton>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SurfaceCard>
      </div>

      {/* PDF Download */}
      {fileUrl && (
        <SurfaceCard className="border-none shadow-sm" contentClassName="pt-6"
        >
          <div className="flex items-center gap-3 rounded-xl border bg-neutral-50/30 p-4"
          >
            <FileText className="w-8 h-8 text-action-blue shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">ملف العقد</p>
              <p className="text-xs text-neutral-300">
                تحميل ملف العقد بصيغة PDF
              </p>
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <ActionButton
                variant="outline"
                size="sm"
                icon={<Download className="w-4 h-4" />}
              >
                تحميل العقد
              </ActionButton>
            </a>
          </div>
        </SurfaceCard>
      )}

      {/* Linked proposal */}
      {data.proposal && (
        <SurfaceCard
          title="العرض الفني الأصلي"
          className="border-none shadow-sm"
        >
          <div className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{data.proposal.title}</p>
              <p className="text-xs text-neutral-300">
                <CurrencyDisplay amount={data.proposal.totalPrice ?? 0} />
              </p>
            </div>
            <Link href={`/dashboard/sales/proposals`}>
              <ActionButton variant="outline" size="sm">
                عرض العروض
              </ActionButton>
            </Link>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
