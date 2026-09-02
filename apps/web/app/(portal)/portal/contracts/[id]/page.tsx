"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import { CheckCircle, PenLine } from "lucide-react";
import {
  useGetPortalContractByIdQuery,
  useSignPortalContractMutation,
} from "@/features/portal/portalApi";
import {
  ContractClientBillingArea,
  ContractDetailLoading,
  ContractDetailView,
} from "@/components/contract-detail/ContractDetailPattern";
import { DetailErrorState } from "@/components/portal/shared/DetailErrorState";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { portalErrorMessage } from "@/lib/i18n";

export default function PortalContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: contract,
    isLoading,
    isError,
    refetch,
  } = useGetPortalContractByIdQuery(id);
  const [signContract, { isLoading: signing }] =
    useSignPortalContractMutation();
  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");
  const [contractStatus, setContractStatus] = useState<string | null>(null);

  if (isLoading) return <ContractDetailLoading />;

  if (isError || !contract) {
    return (
      <DetailErrorState
        title="تعذر تحميل العقد"
        onRetry={refetch}
        backHref="/portal/contracts"
        backLabel="العقود"
      />
    );
  }

  const effectiveStatus = contractStatus ?? contract.status;
  const invoices = Array.isArray(contract.invoices) ? contract.invoices : [];
  const paymentPlans = Array.isArray(contract.paymentPlans)
    ? contract.paymentPlans
    : [];
  const paymentRequired =
    contract.initialPayment?.required ??
    contract.initialPaymentRequired === true;
  const initialPaymentAmount =
    contract.initialPayment?.amount ??
    contract.initialPaymentAmount ??
    paymentPlans.find((plan) => plan.isActive && plan.sequence === 1)
      ?.amountValue ??
    null;
  const initialPaymentStatus =
    contract.initialPayment?.status ?? contract.initialPaymentStatus;
  const initialPaymentPaid = initialPaymentStatus === "PAID";
  const allInvoicesPaid =
    invoices.length > 0 &&
    invoices.every((invoice) => invoice.status === "PAID");
  const canSign =
    effectiveStatus === "SENT" &&
    !!contract.shareLinkToken &&
    (contract.signingEligibility?.canSign ??
      (!paymentRequired ? true : initialPaymentPaid || allInvoicesPaid));

  async function handleSign() {
    if (!signedByName.trim()) {
      toast.error("يرجى كتابة اسمك الكامل قبل التوقيع");
      return;
    }
    try {
      await signContract({
        token: contract.shareLinkToken!,
        body: {
          signedByName: signedByName.trim(),
          signedByEmail: signedByEmail.trim() || undefined,
        },
      }).unwrap();
      setContractStatus("SIGNED");
      toast.success("تم توقيع العقد بنجاح");
      refetch();
    } catch (error) {
      toast.error(portalErrorMessage(error));
    }
  }

  return (
    <ContractDetailView
      contract={{ ...contract, status: effectiveStatus }}
      backHref="/portal/contracts"
      backLabel="العودة إلى العقود"
      fileUrl={
        contract.fileUrl ??
        (contract.filePath ? buildPortalFileUrl(contract.filePath) : null)
      }
      audience="client"
      billingArea={
        <ContractClientBillingArea
          services={contract.servicesList ?? []}
          totalValue={contract.totalValue}
          currency={contract.currency}
          invoices={invoices}
          initialPaymentRequired={paymentRequired}
          initialPaymentAmount={initialPaymentAmount}
          initialPaymentRemainingAmount={
            contract.initialPayment?.remainingAmount
          }
          initialPaymentStatus={initialPaymentStatus}
          canPay={
            contract.paymentEligibility?.canPay ?? effectiveStatus === "SENT"
          }
          onPaymentComplete={() => window.location.reload()}
        />
      }
      responseArea={
        effectiveStatus === "SENT" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <PenLine className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">توقيع العقد</p>
            </div>
            {!canSign ? (
              <p className="text-sm text-muted-foreground">
                يجب دفع جميع الفواتير قبل توقيع العقد.
              </p>
            ) : null}
            <Label htmlFor="portal-contract-signed-name">الاسم الكامل</Label>
            <Input
              id="portal-contract-signed-name"
              value={signedByName}
              onChange={(event) => setSignedByName(event.target.value)}
              placeholder="الاسم الكامل"
              disabled={!canSign}
            />
            <Label htmlFor="portal-contract-signed-email">
              البريد الإلكتروني
            </Label>
            <Input
              id="portal-contract-signed-email"
              value={signedByEmail}
              onChange={(event) => setSignedByEmail(event.target.value)}
              placeholder="البريد الإلكتروني"
              disabled={!canSign}
            />
            <Button onClick={handleSign} disabled={signing || !canSign}>
              <CheckCircle data-icon="inline-start" />
              {signing ? "جارٍ التوقيع..." : "أوافق وأوقّع العقد"}
            </Button>
          </div>
        ) : null
      }
    />
  );
}
