"use client";

import { useState } from "react";
import { Ban, CheckCircle2, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";
import {
  AccountLifecycleAction,
  AccountLifecycleDialog,
} from "./AccountLifecycleDialog";
import { Button } from "@/components/ui/button";

interface AccountLifecycleActionsProps {
  subject: string;
  isActive: boolean;
  isSuspended: boolean;
  hasAccount?: boolean;
  onAction: (
    action: AccountLifecycleAction,
    input: { reason: string; suspendedUntil?: string },
  ) => Promise<{ code?: string } | void>;
}

export function AccountLifecycleActions({
  subject,
  isActive,
  isSuspended,
  hasAccount = true,
  onAction,
}: AccountLifecycleActionsProps) {
  const [action, setAction] = useState<AccountLifecycleAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (input: { reason: string; suspendedUntil?: string }) => {
    if (!action) return;
    setIsLoading(true);
    try {
      const result = await onAction(action, input);
      toast.success(adminSuccessMessage(result ? result.code : action));
      setAction(null);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isSuspended ? (
          <Button
            variant="outline"
            size="sm"
            disabled={!hasAccount}
            onClick={() => setAction("reactivate")}
          >
            <UnlockKeyhole data-icon="inline-start" />
            إعادة التفعيل
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={!hasAccount}
            onClick={() => setAction("suspend")}
          >
            <LockKeyhole data-icon="inline-start" />
            إيقاف مؤقت
          </Button>
        )}
        {isActive ? (
          <Button
            variant="destructive"
            size="sm"
            disabled={!hasAccount}
            onClick={() => setAction("deactivate")}
          >
            <Ban data-icon="inline-start" />
            تعطيل الحساب
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasAccount}
            onClick={() => setAction("activate")}
          >
            <CheckCircle2 data-icon="inline-start" />
            تفعيل الحساب
          </Button>
        )}
      </div>
      <AccountLifecycleDialog
        open={action !== null}
        action={action}
        subject={subject}
        isLoading={isLoading}
        onOpenChange={(open) => {
          if (!open && !isLoading) setAction(null);
        }}
        onSubmit={submit}
      />
    </>
  );
}
