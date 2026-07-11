"use client";

import { use, useState, useCallback } from "react";
import { useGetInvoiceByIdQuery } from "@/features/finance/financeApi";
import { FinanceDetailBreadcrumb } from "@/components/dashboard/finance/shared/FinanceDetailBreadcrumb";
import { FinanceDetailSkeleton } from "@/components/dashboard/finance/shared/FinanceDetailSkeleton";
import { FinanceDetailError } from "@/components/dashboard/finance/shared/FinanceDetailError";
import { InvoiceHeader } from "@/components/dashboard/finance/invoice/InvoiceHeader";
import { InvoiceClientProfile } from "@/components/dashboard/finance/invoice/InvoiceClientProfile";
import { InvoiceItemsTable } from "@/components/dashboard/finance/invoice/InvoiceItemsTable";
import { InvoiceAmountSummary } from "@/components/dashboard/finance/invoice/InvoiceAmountSummary";
import { InvoicePaymentHistory } from "@/components/dashboard/finance/invoice/InvoicePaymentHistory";
import { InvoiceContractCard } from "@/components/dashboard/finance/invoice/InvoiceContractCard";
import { InvoiceChatWidget } from "@/components/dashboard/finance/invoice/InvoiceChatWidget";
import { InvoiceActions } from "@/components/dashboard/finance/invoice/InvoiceActions";
import { InvoiceTimeline } from "@/components/dashboard/finance/invoice/InvoiceTimeline";
import { InvoiceNotes } from "@/components/dashboard/finance/invoice/InvoiceNotes";
import { RegisterPaymentModal } from "@/components/dashboard/finance/invoice/modals/RegisterPaymentModal";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FileText, History, MessageSquare } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/design-system/Tabs";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useGetInvoiceByIdQuery(id);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleActionComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <FinanceDetailSkeleton />;
  }

  if (error || !invoice) {
    return (
      <FinanceDetailError
        title="عذراً، لم يتم العثور على الفاتورة"
        hint="قد يكون الرابط غير صحيح أو تم نقل الفاتورة."
        backHref="/dashboard/finance/invoices"
        backLabel="العودة لقائمة الفواتير"
      />
    );
  }

  const payments = invoice.payments || [];
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = invoice.amount - paidAmount;
  const collectionRate =
    invoice.amount > 0 ? Math.round((paidAmount / invoice.amount) * 100) : 0;

  const history = (invoice as any).history || [];
  const items = (invoice as any).items || [];
  const clientUserId = (invoice.client as any)?.user?.id || null;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Breadcrumb */}
      <FinanceDetailBreadcrumb
        items={[
          { label: "المالية", href: "/dashboard/finance" },
          { label: "الفواتير", href: "/dashboard/finance/invoices" },
          { label: invoice.invoiceNumber },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* ─── Main Column ─── */}
        <div className="space-y-5">
          {/* ── Single cohesive card for all invoice data ── */}
          <SurfaceCard
            icon={FileText}
            className="border-none shadow-md overflow-hidden"
          >
            <div className="space-y-0">
              {/* Header section */}
              <InvoiceHeader invoice={invoice} />

              {/* Divider */}
              <div className="border-t border-portal-divider" />

              {/* Client Profile */}
              <div className="px-6 py-5">
                <InvoiceClientProfile
                  client={invoice.client}
                  clientId={invoice.clientId}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-portal-divider" />

              {/* Items */}
              {items.length > 0 && (
                <>
                  <div className="px-6 py-5">
                    <h3 className="text-base font-medium text-natural-100 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-portal-icon" />
                      بنود الفاتورة
                    </h3>
                    <InvoiceItemsTable
                      items={items}
                      totalAmount={invoice.amount}
                    />
                  </div>
                  <div className="border-t border-portal-divider" />
                </>
              )}

              {/* Amount Summary */}
              <div className="px-6 py-5">
                <InvoiceAmountSummary
                  amount={invoice.amount}
                  paidAmount={paidAmount}
                  remainingAmount={remainingAmount}
                  collectionRate={collectionRate}
                  status={invoice.status}
                  dueDate={invoice.dueDate}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-portal-divider" />

              {/* Payment History */}
              <div className="px-6 py-5">
                <InvoicePaymentHistory
                  payments={payments}
                  invoiceId={invoice.id}
                  remainingAmount={remainingAmount}
                  isLoading={isLoading}
                  onAddPayment={() => setShowPaymentModal(true)}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-portal-divider" />

              {/* Timeline + Notes in tabs */}
              <div className="px-6 py-5">
                <Tabs defaultValue="timeline" dir="rtl" className="w-full">
                  <TabsList className="w-fit mb-4">
                    <TabsTrigger value="timeline" className="rounded-lg gap-2">
                      <History className="w-4 h-4" />
                      سجل الأحداث
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-lg gap-2">
                      <FileText className="w-4 h-4" />
                      ملاحظات
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="timeline">
                    <InvoiceTimeline history={history} />
                  </TabsContent>
                  <TabsContent value="notes">
                    <InvoiceNotes
                      notes={invoice.notes}
                      invoiceId={invoice.id}
                      onUpdate={handleActionComplete}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <InvoiceActions
            invoice={invoice}
            remainingAmount={remainingAmount}
            onActionComplete={handleActionComplete}
          />

          {/* Contract Card */}
          <InvoiceContractCard contract={invoice.contract} />

          {/* Chat with Client */}
          <SurfaceCard
            title="المحادثة"
            icon={MessageSquare}
            className="border-none shadow-sm"
          >
            <InvoiceChatWidget
              clientId={invoice.clientId}
              clientUserId={clientUserId}
            />
          </SurfaceCard>
        </div>
      </div>

      {/* Payment modal */}
      <RegisterPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoiceId={invoice.id}
        maxAmount={remainingAmount}
        onSuccess={handleActionComplete}
      />
    </div>
  );
}
