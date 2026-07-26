"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Plus, Star, Trash2, Eye } from "lucide-react";
import { PageIntro } from "@/components/design-system/PageIntro";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
} from "@/components/design-system/DataTable";
import { ActionButton } from "@/components/design-system/ActionButton";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import {
  useGetCurrencySettingsQuery,
  useDeleteCurrencySettingMutation,
  type CurrencySetting,
} from "@/features/settings/settingsApi";
import type { CurrencyConfig } from "@/hooks/useCurrency";

const COLUMNS: DataTableColumn[] = [
  { id: "code", label: "الرمز", align: "right" },
  { id: "symbol", label: "الترميز", align: "right" },
  { id: "name", label: "الاسم", align: "right" },
  { id: "exchangeRate", label: "سعر الصرف", align: "right" },
  { id: "preview", label: "معاينة", align: "right" },
  { id: "status", label: "الحالة", align: "right" },
  { id: "default", label: "افتراضي", align: "center" },
  { id: "actions", label: "", align: "left" },
];

const EMPTY_STATE: DataTableEmptyState = {
  icon: DollarSign,
  message: "لم يتم إضافة أي عملات بعد",
  hint: "يمكنك إضافة عملة جديدة لاستخدامها في النظام.",
};

function toCurrencyConfig(c: CurrencySetting): CurrencyConfig {
  return {
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    symbolType: c.symbolType,
    svgKey: c.svgKey,
    svgWidth: c.svgWidth,
    svgHeight: c.svgHeight,
    isDefault: c.isDefault,
    exchangeRate: c.exchangeRate,
  };
}

const LOCALE = "ar-SA-u-nu-latn";
function fmtAmount(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function AdminCurrenciesPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetCurrencySettingsQuery();
  const [deleteCurrency, { isLoading: isDeleting }] =
    useDeleteCurrencySettingMutation();
  const [deleteTarget, setDeleteTarget] = useState<CurrencySetting | null>(
    null,
  );

  const currencies = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const total = currencies.length;
    const active = currencies.filter((c) => c.isActive).length;
    const defaultCurrency = currencies.find((c) => c.isDefault);
    return { total, active, defaultCurrency };
  }, [currencies]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCurrency(deleteTarget.id).unwrap();
      toast.success("تم حذف العملة بنجاح");
      setDeleteTarget(null);
    } catch {
      toast.error("حدث خطأ أثناء حذف العملة");
    }
  }

  return (
    <div className="page-shell" dir="rtl">
      <PageIntro
        title="العملات"
        description="إدارة العملات المستخدمة في النظام"
        icon={DollarSign}
        actions={
          <ActionButton
            href="/dashboard/admin/settings/currencies/new"
            icon={<Plus className="size-4" />}
            variant="primary"
          >
            إضافة عملة
          </ActionButton>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-portal-note-text">إجمالي العملات</p>
              <p className="text-2xl font-bold text-natural-100 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-badge-gray-bg">
              <DollarSign className="h-6 w-6 text-secondary-500" />
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-portal-note-text">العملات النشطة</p>
              <p className="text-2xl font-bold text-natural-100 mt-1">
                {stats.active}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
              <Eye className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-portal-note-text">العملة الافتراضية</p>
              <p className="text-2xl font-bold text-natural-100 mt-1">
                {stats.defaultCurrency?.name ?? "—"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* Table */}
      <SurfaceCard>
        <DataTable
          columns={COLUMNS}
          data={currencies}
          isLoading={isLoading}
          isError={isError}
          emptyState={EMPTY_STATE}
          renderCells={(currency: CurrencySetting) => {
            const cfg = toCurrencyConfig(currency);
            return [
              <td key="code" className="px-5 py-4">
                <span className="font-mono text-sm font-medium text-natural-100">
                  {currency.code}
                </span>
              </td>,
              <td key="symbol" className="px-5 py-4">
                <SymbolRenderer currency={cfg} width={24} height={24} />
              </td>,
              <td key="name" className="px-5 py-4">
                <span className="text-sm text-natural-100">
                  {currency.name}
                </span>
              </td>,
              <td key="exchangeRate" className="px-5 py-4">
                <span className="text-sm text-portal-note-text font-mono">
                  {currency.exchangeRate}
                </span>
              </td>,
              <td key="preview" className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-natural-100">
                    {fmtAmount(1500)}
                  </span>
                  <SymbolRenderer currency={cfg} width={18} height={18} />
                </div>
              </td>,
              <td key="status" className="px-5 py-4">
                <StatusBadge
                  status={currency.isActive ? "ACTIVE" : "STOPPED"}
                  label={currency.isActive ? "نشط" : "غير نشط"}
                />
              </td>,
              <td key="default" className="px-5 py-4 text-center">
                {currency.isDefault ? (
                  <Star className="inline-block size-4 text-amber-500 fill-amber-500" />
                ) : (
                  <span className="text-portal-note-text">—</span>
                )}
              </td>,
              <td key="actions" className="px-5 py-4">
                <div className="flex items-center justify-end gap-1">
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/admin/settings/currencies/${currency.id}`,
                      )
                    }
                  >
                    تعديل
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(currency)}
                    disabled={currency.isDefault}
                    title={
                      currency.isDefault
                        ? "لا يمكن حذف العملة الافتراضية"
                        : undefined
                    }
                  >
                    <Trash2 className="size-4 text-danger-500" />
                  </ActionButton>
                </div>
              </td>,
            ];
          }}
        />
      </SurfaceCard>

      {/* Delete dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`حذف العملة ${deleteTarget?.name ?? ""}`}
        description="هل أنت متأكد من حذف هذه العملة؟ لا يمكن التراجع عن هذا الإجراء."
        footer={
          <div className="flex gap-3 w-full">
            <ActionButton
              variant="outline"
              fullWidth
              onClick={() => setDeleteTarget(null)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              variant="primary"
              fullWidth
              loading={isDeleting}
              onClick={handleDelete}
              className="bg-danger-500 hover:bg-danger-600"
            >
              حذف
            </ActionButton>
          </div>
        }
      >
        {deleteTarget?.isDefault && (
          <p className="text-sm text-danger-500">
            لا يمكن حذف العملة الافتراضية. يرجى تعيين عملة أخرى كافتراضية أولاً.
          </p>
        )}
      </Dialog>
    </div>
  );
}
