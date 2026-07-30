"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import { CheckCircle, PenLine } from "lucide-react";
import { useGetPortalContractByIdQuery, useSignPortalContractMutation } from "@/features/portal/portalApi";
import { ContractClientBillingArea, ContractDetailLoading, ContractDetailView } from "@/components/contract-detail/ContractDetailPattern";
import { DetailErrorState } from "@/components/portal/shared/DetailErrorState";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PortalContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: contract, isLoading, isError, refetch } = useGetPortalContractByIdQuery(id);
  const [signContract, { isLoading: signing }] = useSignPortalContractMutation();
  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");

  if (isLoading) return <ContractDetailLoading />;

  if (isError || !contract) {
    return <DetailErrorState title="تعذر تحميل العقد" backHref="/portal/contracts" backLabel="العقود" />;
  }

  const invoices = contract.invoices ?? [];
  const canSign = contract.status === "SENT" && !!contract.shareLinkToken;
  const allInvoicesPaid = invoices.length > 0 ? invoices.every((invoice) => invoice.status === "PAID") : true;

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
      toast.success("تم توقيع العقد بنجاح");
      refetch();
    } catch {
      toast.error("تعذّر توقيع العقد");
    }
  }

  return (
    <ContractDetailView
      contract={contract}
      backHref="/portal/contracts"
      backLabel="العودة إلى العقود"
      fileUrl={contract.filePath ? buildPortalFileUrl(contract.filePath) : null}
      audience="client"
      billingArea={
        <ContractClientBillingArea
          services={contract.servicesList ?? []}
          totalValue={contract.totalValue}
          invoices={invoices}
          canPay={canSign}
          onPaymentComplete={() => window.location.reload()}
        />
      }
      responseArea={
        canSign ? (
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-2">
                <PenLine className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">توقيع العقد</p>
              </div>
              {!allInvoicesPaid ? (
                <p className="text-sm text-muted-foreground">
                  يجب دفع جميع الفواتير قبل توقيع العقد.
                </p>
              ) : null}
              <Input
                value={signedByName}
                onChange={(event) => setSignedByName(event.target.value)}
                placeholder="الاسم الكامل"
                disabled={!allInvoicesPaid}
              />
              <Input
                value={signedByEmail}
                onChange={(event) => setSignedByEmail(event.target.value)}
                placeholder="البريد الإلكتروني"
                disabled={!allInvoicesPaid}
              />
              <Button onClick={handleSign} disabled={signing || !allInvoicesPaid}>
                <CheckCircle data-icon="inline-start" />
                {signing ? "جارٍ التوقيع..." : "أوافق وأوقّع العقد"}
              </Button>
            </CardContent>
          </Card>
        ) : null
      }
    />
  );
}
