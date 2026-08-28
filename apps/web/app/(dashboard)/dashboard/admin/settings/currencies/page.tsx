"use client";

import Link from "next/link";
import { useState } from "react";
import { Coins, Eye, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import CurrencyForm from "@/components/dashboard/admin/settings/CurrencyForm";
import { SymbolRenderer } from "@/components/design-system/CurrencySymbol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AdminEmptyState, AdminPageError, AdminPageLoading } from "@/components/dashboard/admin/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteCurrencySettingMutation,
  useGetCurrencySettingsQuery,
  useUpdateCurrencySettingMutation,
  type CurrencySetting,
  type UpdateCurrencySettingRequest,
} from "@/features/settings/settingsApi";
import { formatNumber } from "@/lib/format";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
const symbolTypeLabels: Record<CurrencySetting["symbolType"] | "SVG_UPLOAD", string> = {
  TEXT: "نص",
  SVG_URL: "رابط SVG",
  SVG_INLINE: "SVG مرفق",
  SVG_UPLOAD: "SVG مرفوع",
};

function CurrencyListLoading() {
  return <div dir="rtl"><AdminPageLoading /></div>;
}

function CurrencyTable({
  currencies,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleActive,
  updatingId,
  deletingId,
}: {
  currencies: CurrencySetting[];
  onEdit: (currency: CurrencySetting) => void;
  onDelete: (currency: CurrencySetting) => void;
  onSetDefault: (currency: CurrencySetting) => void;
  onToggleActive: (currency: CurrencySetting) => void;
  updatingId?: string;
  deletingId?: string;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0" role="region" aria-label="جدول العملات، يمكن التمرير أفقياً على الشاشات الصغيرة">
        <Table className="min-w-[60rem]">
          <caption className="sr-only">قائمة العملات وإعدادات الحالة والعملة الافتراضية</caption>
          <TableHeader>
            <TableRow>
              <TableHead>العملة</TableHead>
              <TableHead>الرمز</TableHead>
              <TableHead>نوع الرمز</TableHead>
              <TableHead>سعر الصرف</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الافتراضية</TableHead>
              <TableHead className="text-end">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencies.map((currency) => {
              const isUpdating = updatingId === currency.id || updatingId === "pending";
              return (
                <TableRow key={currency.id}>
                  <TableCell>
                    <div className="flex min-w-40 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"><SymbolRenderer currency={currency} width={24} height={22} /></div>
                      <div><p className="font-medium">{currency.name}</p><p className="text-sm text-muted-foreground">{currency.code}</p></div>
                    </div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-2"><SymbolRenderer currency={currency} /><span>{currency.symbol}</span></div></TableCell>
                  <TableCell><Badge variant="outline">{symbolTypeLabels[currency.symbolType]}</Badge></TableCell>
                  <TableCell>{formatNumber(currency.exchangeRate)}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="min-h-11" disabled={isUpdating} aria-busy={isUpdating} onClick={() => onToggleActive(currency)} aria-label={`${currency.isActive ? "تعطيل" : "تفعيل"} ${currency.name}`}><Badge variant={currency.isActive ? "secondary" : "warning"}>{currency.isActive ? "نشطة" : "غير نشطة"}</Badge></Button></TableCell>
                  <TableCell>{currency.isDefault ? <Badge variant="secondary">افتراضية</Badge> : <Button variant="ghost" size="sm" className="min-h-11 gap-2" disabled={isUpdating} aria-busy={isUpdating} onClick={() => onSetDefault(currency)} aria-label={`تعيين ${currency.name} كعملة افتراضية`}><Star data-icon="inline-start" />تعيين</Button>}</TableCell>
                  <TableCell><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label={`عرض ${currency.name}`}><Link href={`/dashboard/admin/settings/currencies/${currency.id}`}><Eye data-icon="inline-start" /></Link></Button><Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => onEdit(currency)} aria-label={`تعديل ${currency.name}`}><Pencil data-icon="inline-start" /></Button><Button variant="ghost" size="icon" className="min-h-11 min-w-11 text-destructive" disabled={deletingId === currency.id} onClick={() => onDelete(currency)} aria-label={`حذف ${currency.name}`}><Trash2 data-icon="inline-start" /></Button></div></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function SettingsCurrenciesPage() {
  const { data: currencies, isLoading, isFetching, isError, refetch } = useGetCurrencySettingsQuery();
  const [updateCurrency, { isLoading: isUpdating }] = useUpdateCurrencySettingMutation();
  const [deleteCurrency, { isLoading: isDeleting }] = useDeleteCurrencySettingMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencySetting>();
  const [currencyToDelete, setCurrencyToDelete] = useState<CurrencySetting>();
  const [updatingId, setUpdatingId] = useState<string>();

  if (isLoading) return <CurrencyListLoading />;

  const openCreate = () => { setEditingCurrency(undefined); setDialogOpen(true); };
  const openEdit = (currency: CurrencySetting) => { setEditingCurrency(currency); setDialogOpen(true); };
  const runUpdate = async (currency: CurrencySetting, body: UpdateCurrencySettingRequest, successCode: string) => {
    setUpdatingId(currency.id);
    try { await updateCurrency({ id: currency.id, body }).unwrap(); toast.success(adminSuccessMessage(successCode)); } catch (error) { toast.error(adminErrorMessage(error)); } finally { setUpdatingId(undefined); }
  };
  const handleDelete = async () => {
    if (!currencyToDelete) return;
    try { await deleteCurrency(currencyToDelete.id).unwrap(); toast.success(adminSuccessMessage("CURRENCY_DELETED")); setCurrencyToDelete(undefined); } catch (error) { toast.error(adminErrorMessage(error)); }
  };

  if (isError) return <div dir="rtl" className="flex flex-col gap-6"><PageHeader title="إعدادات العملات" icon={Coins} /><AdminPageError title="تعذر تحميل العملات" description="حدث خطأ أثناء جلب إعدادات العملات. حاول مرة أخرى." onRetry={() => void refetch()} /></div>;

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader title="إعدادات العملات" description="إدارة العملات والعملة الافتراضية للنظام." icon={Coins} actions={<div className="flex flex-wrap gap-2"><Button onClick={openCreate}><Plus data-icon="inline-start" />إضافة عملة</Button><Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw data-icon="inline-start" />{isFetching ? "جارٍ التحديث" : "تحديث"}</Button></div>} />
      {!currencies?.length ? <Card><CardContent className="p-8"><AdminEmptyState icon={Coins} title="لا توجد عملات" description="أضف أول عملة لاستخدامها في النظام." actionLabel="إضافة عملة" onAction={openCreate} /></CardContent></Card> : <CurrencyTable currencies={currencies} onEdit={openEdit} onDelete={setCurrencyToDelete} onSetDefault={(currency) => runUpdate(currency, { isDefault: true }, "CURRENCY_DEFAULT_SET")} onToggleActive={(currency) => runUpdate(currency, { isActive: !currency.isActive }, currency.isActive ? "CURRENCY_DEACTIVATED" : "CURRENCY_ACTIVATED")} updatingId={updatingId ?? (isUpdating ? "pending" : undefined)} deletingId={isDeleting ? currencyToDelete?.id : undefined} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>{editingCurrency ? `تعديل ${editingCurrency.name}` : "إضافة عملة جديدة"}</DialogTitle><DialogDescription>أدخل بيانات العملة وإعدادات عرضها في النظام.</DialogDescription></DialogHeader>
          <CurrencyForm
            key={editingCurrency?.id ?? "create"}
            mode={editingCurrency ? "edit" : "create"}
            initialData={editingCurrency}
            onSuccess={() => { setDialogOpen(false); setEditingCurrency(undefined); }}
            onCancel={() => { setDialogOpen(false); setEditingCurrency(undefined); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(currencyToDelete)} onOpenChange={(open) => { if (!open && !isDeleting) setCurrencyToDelete(undefined); }}>
        <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف العملة؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف «{currencyToDelete?.name}» نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel><AlertDialogAction disabled={isDeleting} onClick={(event) => { event.preventDefault(); void handleDelete(); }}>{isDeleting ? "جارٍ الحذف" : "حذف"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
