"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type AccountLifecycleAction =
  | "activate"
  | "deactivate"
  | "suspend"
  | "reactivate";

interface AccountLifecycleDialogProps {
  open: boolean;
  action: AccountLifecycleAction | null;
  subject: string;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    reason: string;
    suspendedUntil?: string;
  }) => Promise<void>;
}

const ACTION_COPY: Record<
  AccountLifecycleAction,
  { title: string; description: string; submit: string }
> = {
  activate: {
    title: "تفعيل الحساب",
    description: "سيتمكن الحساب من تسجيل الدخول واستخدام النظام.",
    submit: "تفعيل الحساب",
  },
  deactivate: {
    title: "تعطيل الحساب",
    description: "سيتم منع الحساب من تسجيل الدخول وإلغاء جلساته الحالية.",
    submit: "تعطيل الحساب",
  },
  suspend: {
    title: "إيقاف الحساب مؤقتاً",
    description:
      "سيتم منع الحساب من الوصول حتى إعادة التفعيل أو انتهاء المدة المحددة.",
    submit: "إيقاف الحساب",
  },
  reactivate: {
    title: "إعادة تفعيل الحساب",
    description:
      "سيتم إزالة حالة الإيقاف والسماح للحساب بالوصول وفقاً لحالة التفعيل.",
    submit: "إعادة التفعيل",
  },
};

export function AccountLifecycleDialog({
  open,
  action,
  subject,
  isLoading = false,
  onOpenChange,
  onSubmit,
}: AccountLifecycleDialogProps) {
  const [reason, setReason] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState("");
  const copy = action ? ACTION_COPY[action] : ACTION_COPY.activate;
  const requiresSuspensionDate = action === "suspend";

  const close = () => {
    if (!isLoading) {
      setReason("");
      setSuspendedUntil("");
      onOpenChange(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (!action || !trimmedReason) return;
    await onSubmit({
      reason: trimmedReason,
      ...(requiresSuspensionDate && suspendedUntil ? { suspendedUntil } : {}),
    });
    setReason("");
    setSuspendedUntil("");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {copy.description} الحساب المستهدف: {subject}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-lifecycle-reason">السبب</Label>
            <Textarea
              id="account-lifecycle-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="اكتب سبب الإجراء"
              aria-required="true"
              disabled={isLoading}
              className="min-h-24"
            />
          </div>
          {requiresSuspensionDate ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="account-lifecycle-until">
                تاريخ انتهاء الإيقاف (اختياري)
              </Label>
              <Input
                id="account-lifecycle-until"
                type="date"
                value={suspendedUntil}
                onChange={(event) => setSuspendedUntil(event.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                disabled={isLoading}
              />
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading || !reason.trim()}>
              {isLoading ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              {isLoading ? "جارٍ التنفيذ" : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
