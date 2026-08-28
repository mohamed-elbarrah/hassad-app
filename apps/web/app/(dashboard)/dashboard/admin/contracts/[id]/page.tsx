"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileClock, RefreshCw } from "lucide-react";
import { ContractStatus } from "@hassad/shared";
import {
  useCancelAdminContractMutation,
  useConvertAdminContractToProjectMutation,
  useGetAdminContractActorCapabilitiesQuery,
  useGetAdminContractByIdQuery,
  useTriggerAdminContractRenewalAlertMutation,
  useUpdateAdminContractStatusMutation,
} from "@/features/admin/adminContractsApi";
import {
  ContractClientBillingArea,
  ContractDetailLoading,
  ContractDetailView,
} from "@/components/contract-detail/ContractDetailPattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { adminErrorMessage, adminSuccessMessage, contractStatusLabel } from "@/lib/i18n";
import { ErrorState } from "@/components/design-system/EmptyState";

function getContractServices(value: unknown): Array<{ name: string; price: number }> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { name: string; price: number } => (
    typeof item === "object" && item !== null &&
    typeof (item as { name?: unknown }).name === "string" &&
    typeof (item as { price?: unknown }).price === "number"
  ));
}

export default function AdminContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: contract,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminContractByIdQuery(id);
  const {
    data: capabilities,
    error: capabilitiesError,
    isError: isCapabilitiesError,
    refetch: refetchCapabilities,
  } = useGetAdminContractActorCapabilitiesQuery();
  const canIntervene = capabilities?.canIntervene === true;

  const [cancel, cancelState] = useCancelAdminContractMutation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [statusToUpdate, setStatusToUpdate] = useState<ContractStatus | null>(null);
  const [triggerRenewalAlert, renewalState] = useTriggerAdminContractRenewalAlertMutation();
  const [convertToProject, conversionState] = useConvertAdminContractToProjectMutation();
  const [updateStatus, statusState] = useUpdateAdminContractStatusMutation();

  if (isLoading) return <ContractDetailLoading />;

  if (isError || !contract) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FileClock />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{isError ? "تعذر تحميل العقد" : "العقد غير موجود"}</EmptyTitle>
                <EmptyDescription>
                  {isError ? adminErrorMessage(error) : "لم نتمكن من العثور على بيانات هذا العقد."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap justify-center gap-2">
                  {isError ? <Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button> : null}
                  <Button asChild>
                    <Link href="/dashboard/admin/contracts">
                      <ArrowLeft data-icon="inline-start" />
                      العودة إلى العقود
                    </Link>
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <ContractDetailView
      contract={contract}
      backHref="/dashboard/admin/contracts"
      backLabel="العودة إلى العقود"
      fileUrl={contract.fileUrl}
      billingArea={
        <ContractClientBillingArea
          services={getContractServices(contract.servicesList)}
          totalValue={contract.totalValue}
          invoices={contract.invoices}
          canPay={false}
        />
      }
      actions={
        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/admin/clients/${contract.clientId}`}>ملف العميل</Link>
            </Button>
            {contract.project ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/admin/projects/${contract.project.id}`}>المشروع</Link>
              </Button>
            ) : null}
            {isCapabilitiesError ? (
              <ErrorState
                title="تعذّر تحميل صلاحيات الإدارة"
                message={adminErrorMessage(capabilitiesError)}
                onRetry={() => refetchCapabilities()}
                className="min-h-0 flex-row gap-2 rounded-md border-0 bg-transparent p-0"
              />
            ) : canIntervene ? (
              <>
                {contract.status === ContractStatus.ACTIVE ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => triggerRenewalAlert(id)} disabled={renewalState.isLoading}>
                      <RefreshCw data-icon="inline-start" />{renewalState.isLoading ? "جارٍ الجدولة..." : "جدولة تنبيه التجديد"}
                    </Button>
                    {!contract.project ? (
                      <Button size="sm" onClick={() => convertToProject({ id })} disabled={conversionState.isLoading}>
                        {conversionState.isLoading ? "جارٍ التحويل..." : "تحويل إلى مشروع"}
                      </Button>
                    ) : null}
                  </>
                ) : null}
                {contract.status !== ContractStatus.CANCELLED ? (
                  <Button size="sm" variant="destructive" onClick={() => setCancelOpen(true)} disabled={cancelState.isLoading}>
                    {cancelState.isLoading ? "جارٍ الإلغاء..." : "إلغاء العقد"}
                  </Button>
                ) : null}
                <Select
                  value={contract.status}
                  onValueChange={(status) => setStatusToUpdate(status as ContractStatus)}
                  disabled={statusState.isLoading}
                >
                  <SelectTrigger id="admin-contract-detail-status" aria-label="تحديث حالة العقد" className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.values(ContractStatus).map((status) => <SelectItem key={status} value={status}>{contractStatusLabel(status)}</SelectItem>)}</SelectContent>
                </Select>
              </>
            ) : null}
          </div>
          {[cancelState, renewalState, conversionState, statusState].map((state, index) => state.error ? <p key={`error-${index}`} role="alert" className="text-sm text-destructive">{adminErrorMessage(state.error)}</p> : null)}
          {[cancelState, renewalState, conversionState, statusState].map((state, index) => state.data ? <p key={`success-${index}`} role="status" className="text-sm text-success-600">{adminSuccessMessage(state.data.code)}</p> : null)}
        </div>
      }
      />
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء العقد</AlertDialogTitle>
            <AlertDialogDescription>سيتم تغيير حالة العقد إلى ملغى وتسجيل هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <label htmlFor="admin-contract-cancel-reason" className="text-sm font-medium">سبب الإلغاء (اختياري)</label>
          <Input id="admin-contract-cancel-reason" aria-label="سبب الإلغاء" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="سبب الإلغاء (اختياري)" />
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction disabled={cancelState.isLoading} onClick={(event) => { event.preventDefault(); void cancel({ id, reason: cancelReason.trim() || undefined }).unwrap().then(() => { setCancelOpen(false); setCancelReason(""); }).catch(() => undefined); }}>تأكيد الإلغاء</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={statusToUpdate !== null} onOpenChange={(open) => { if (!open) setStatusToUpdate(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تحديث حالة العقد</AlertDialogTitle>
            <AlertDialogDescription>سيتم تسجيل تغيير حالة العقد في سجل الإجراءات.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction disabled={statusState.isLoading} onClick={(event) => { event.preventDefault(); if (statusToUpdate) void updateStatus({ id, status: statusToUpdate }).unwrap().then(() => setStatusToUpdate(null)).catch(() => undefined); }}>تأكيد التحديث</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
