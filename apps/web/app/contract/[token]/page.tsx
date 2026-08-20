"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import { CheckCircle, PenLine } from "lucide-react";
import {
  useGetContractByTokenQuery,
  useSignContractByTokenMutation,
} from "@/features/contracts/contractsApi";
import {
  ContractClientBillingArea,
  ContractDetailLoading,
  ContractDetailView,
} from "@/components/contract-detail/ContractDetailPattern";
import { buildPortalFileUrl } from "@/lib/portal-files";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContractSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const {
    data: contract,
    isLoading,
    isError,
    refetch,
  } = useGetContractByTokenQuery(token);
  const [signContract, { isLoading: signing }] =
    useSignContractByTokenMutation();
  const [signedByName, setSignedByName] = useState("");
  const [signedByEmail, setSignedByEmail] = useState("");

  if (isLoading) return <ContractDetailLoading />;

  if (isError || !contract) {
    return (
      <div dir="rtl" className="p-6">
        <Card>
          <CardContent className="p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <FileClock />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>العقد غير متوفر</EmptyTitle>
                <EmptyDescription>
                  الرابط غير صالح أو انتهت صلاحيته.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invoices = contract.invoices ?? [];
  const paymentRequired = contract.initialPaymentRequired === true;
  const initialPaymentPaid = contract.initialPaymentStatus === "PAID";
  const allInvoicesPaid =
    invoices.length > 0 &&
    invoices.every((invoice) => invoice.status === "PAID");
  const canSign =
    contract.status === "SENT" &&
    (!paymentRequired ? true : initialPaymentPaid || allInvoicesPaid);

  async function handleSign() {
    if (!signedByName.trim()) {
      toast.error("يرجى كتابة اسمك الكامل قبل التوقيع");
      return;
    }
    try {
      await signContract({
        token,
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
      backHref="/"
      backLabel="العودة"
      fileUrl={contract.filePath ? buildPortalFileUrl(contract.filePath) : null}
      audience="client"
      billingArea={
        <ContractClientBillingArea
          services={contract.servicesList ?? []}
          totalValue={contract.totalValue}
          invoices={invoices}
          canPay={contract.status === "SENT"}
          onPaymentComplete={() => window.location.reload()}
        />
      }
      responseArea={
        contract.status === "SENT" ? (
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-2">
                <PenLine className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">توقيع العقد</p>
              </div>
              {!canSign ? (
                <p className="text-sm text-muted-foreground">
                  يجب دفع جميع الفواتير قبل توقيع العقد.
                </p>
              ) : null}
              <Input
                value={signedByName}
                onChange={(event) => setSignedByName(event.target.value)}
                placeholder="الاسم الكامل"
                disabled={!canSign}
              />
              <Input
                value={signedByEmail}
                onChange={(event) => setSignedByEmail(event.target.value)}
                placeholder="البريد الإلكتروني"
                disabled={!canSign}
              />
              <Button onClick={handleSign} disabled={signing || !canSign}>
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
