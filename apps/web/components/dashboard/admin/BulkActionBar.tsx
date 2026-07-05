"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { Dialog } from "@/components/design-system/Dialog";

export interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "primary" | "outline" | "ghost";
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  onExecute: (ids: string[]) => Promise<{ affected: number; failed: string[] }>;
}

interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionBar({
  selectedIds,
  onClear,
  actions,
}: BulkActionBarProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [result, setResult] = useState<{
    affected: number;
    failed: string[];
  } | null>(null);

  if (selectedIds.length === 0) return null;

  const handleExecute = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmAction(action);
      return;
    }
    await runAction(action);
  };

  const runAction = async (action: BulkAction) => {
    setIsExecuting(true);
    setResult(null);
    try {
      const res = await action.onExecute(selectedIds);
      setResult(res);
      if (res.failed.length === 0) {
        onClear();
      }
    } catch {
      setResult({ affected: 0, failed: selectedIds });
    } finally {
      setIsExecuting(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-3 rounded-2xl border border-secondary-200 bg-secondary-50 px-4 py-3 shadow-sm">
        <span className="text-sm font-medium text-secondary-700 whitespace-nowrap">
          {selectedIds.length} محدد
        </span>
        <div className="h-5 w-px bg-secondary-200" />
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <ActionButton
                key={action.label}
                variant={action.variant ?? "primary"}
                size="sm"
                disabled={isExecuting}
                onClick={() => handleExecute(action)}
              >
                {Icon && <Icon className="size-3.5 ml-1" />}
                {action.label}
              </ActionButton>
            );
          })}
        </div>
        <div className="mr-auto">
          <ActionButton
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={isExecuting}
          >
            <X className="size-3.5 ml-1" />
            إلغاء التحديد
          </ActionButton>
        </div>
        {isExecuting && (
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <Loader2 className="size-4 animate-spin" />
            جارٍ التنفيذ...
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction?.confirmationTitle ?? "تأكيد العملية"}
        description={confirmAction?.confirmationMessage}
        icon={AlertTriangle}
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              إلغاء
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={() => confirmAction && runAction(confirmAction)}
            >
              تأكيد
            </ActionButton>
          </div>
        }
      >
        <div />
      </Dialog>

      {/* Result dialog */}
      <Dialog
        open={!!result}
        onOpenChange={(open) => {
          if (!open) setResult(null);
        }}
        title={
          result?.failed.length === 0 ? "تمت العملية بنجاح" : "اكتمل مع أخطاء"
        }
        description={
          result
            ? `تم بنجاح: ${result.affected}، فشل: ${result.failed.length}`
            : ""
        }
        footer={
          <div className="flex gap-2 justify-end">
            <ActionButton onClick={() => setResult(null)}>حسناً</ActionButton>
          </div>
        }
      >
        <div />
      </Dialog>
    </>
  );
}
