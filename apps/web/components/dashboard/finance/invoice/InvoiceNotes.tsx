"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { useUpdateInvoiceMutation } from "@/features/finance/financeApi";
import { toast } from "sonner";

interface InvoiceNotesProps {
  notes: string | null | undefined;
  invoiceId: string;
  onUpdate?: () => void;
}

export function InvoiceNotes({
  notes,
  invoiceId,
  onUpdate,
}: InvoiceNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState(notes || "");
  const [updateInvoice, { isLoading }] = useUpdateInvoiceMutation();

  const handleSave = async () => {
    try {
      await updateInvoice({ id: invoiceId, notes: newNote }).unwrap();
      toast.success("تم حفظ الملاحظة");
      setIsEditing(false);
      onUpdate?.();
    } catch {
      toast.error("فشل حفظ الملاحظة");
    }
  };

  const handleCancel = () => {
    setNewNote(notes || "");
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="أضف ملاحظة..."
            className="w-full rounded-xl border border-portal-card-border bg-natural-0 px-4 py-3 text-sm text-natural-100 resize-none focus:outline-none focus:ring-2 focus:ring-secondary-500/30"
            rows={4}
            dir="rtl"
          />
          <div className="flex gap-2">
            <ActionButton
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={isLoading}
            >
              حفظ
            </ActionButton>
            <ActionButton variant="outline" size="sm" onClick={handleCancel}>
              إلغاء
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notes ? (
            <p className="text-sm text-natural-100 leading-relaxed bg-alert-50/30 rounded-xl p-3 border border-alert-100">
              {notes}
            </p>
          ) : (
            <p className="text-sm text-portal-note-text">لا توجد ملاحظات</p>
          )}
          <ActionButton
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-secondary-500"
            onClick={() => setIsEditing(true)}
            icon={<Plus className="w-3 h-3" />}
          >
            {notes ? "تعديل الملاحظة" : "إضافة ملاحظة"}
          </ActionButton>
        </div>
      )}
    </div>
  );
}
