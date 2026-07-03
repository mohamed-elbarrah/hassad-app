"use client";

import { Ticket, Plus, CheckCircle2 } from "lucide-react";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FinanceStatusBadge } from "@/components/dashboard/finance/FinanceStatusBadge";
import { useCreatePaymentTicketMutation, useResolvePaymentTicketMutation } from "@/features/finance/financeApi";
import { toast } from "sonner";
import { formatDateTz } from "@/lib/format";

interface TicketData {
  id: string;
  status: string;
  notes?: string | null;
  assignedTo?: string | null;
  createdAt: string | Date;
  assignee?: { id: string; name: string } | null;
}

interface InvoicePaymentTicketsProps {
  tickets: TicketData[];
  invoiceId: string;
  clientId: string;
}

export function InvoicePaymentTickets({
  tickets,
  invoiceId,
  clientId,
}: InvoicePaymentTicketsProps) {
  const [createTicket, { isLoading: isCreating }] =
    useCreatePaymentTicketMutation();
  const [resolveTicket, { isLoading: isResolving }] =
    useResolvePaymentTicketMutation();

  const handleCreate = async () => {
    try {
      await createTicket({
        invoiceId,
        clientId,
        notes: "تم إنشاء تذكرة تحصيل من صفحة الفاتورة",
      }).unwrap();
      toast.success("تم إنشاء تذكرة التحصيل");
    } catch {
      toast.error("فشل إنشاء التذكرة");
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      await resolveTicket(ticketId).unwrap();
      toast.success("تم حل التذكرة");
    } catch {
      toast.error("فشل حل التذكرة");
    }
  };

  if (!tickets || tickets.length === 0) {
    return (
      <SurfaceCard
        title="تذاكر التحصيل"
        icon={Ticket}
        className="border-none shadow-sm"
      >
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-portal-note-text">
            لا توجد تذاكر تحصيل
          </p>
          <ActionButton
            variant="outline"
            size="sm"
            icon={<Plus className="w-3 h-3" />}
            onClick={handleCreate}
            loading={isCreating}
          >
            إنشاء تذكرة تحصيل
          </ActionButton>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      title="تذاكر التحصيل"
      description={`${tickets.length} تذكرة`}
      icon={Ticket}
      action={
        <ActionButton
          variant="outline"
          size="sm"
          icon={<Plus className="w-3 h-3" />}
          onClick={handleCreate}
          loading={isCreating}
        >
          جديد
        </ActionButton>
      }
      className="border-none shadow-sm"
    >
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-xl border border-portal-card-border bg-portal-bg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <FinanceStatusBadge status={ticket.status} />
              {ticket.status === "PENDING" && (
                <ActionButton
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  icon={<CheckCircle2 className="w-3 h-3" />}
                  onClick={() => handleResolve(ticket.id)}
                  loading={isResolving}
                >
                  حل
                </ActionButton>
              )}
            </div>
            {ticket.notes && (
              <p className="text-xs text-portal-note-text">{ticket.notes}</p>
            )}
            <div className="flex justify-between text-[10px] text-portal-note-text">
              <span>
                {ticket.assignee?.name
                  ? `مسند إلى: ${ticket.assignee.name}`
                  : "غير مسند"}
              </span>
              <span>{formatDateTz(ticket.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
