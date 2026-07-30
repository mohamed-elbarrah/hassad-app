"use client";

import { useState } from "react";
import { CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface PmResolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (message: string) => void;
  isLoading?: boolean;
}

export function PmResolveDialog({
  open,
  onOpenChange,
  onResolve,
  isLoading = false,
}: PmResolveDialogProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim().length < 10) return;
    onResolve(message.trim());
  };

  const handleClose = () => {
    if (isLoading) return;
    setMessage("");
    onOpenChange(false);
  };

  const isValid = message.trim().length >= 10;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تأكيد حل المشكلة</DialogTitle>
          <DialogDescription>أخبر العميل كيف تم حل المشكلة.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-sm text-green-800">
            <p className="font-medium">ماذا سيحدث؟</p>
            <p>سيتم إرسال رسالتك للعميل وسيُطلب منه تأكيد الحل.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-natural-100">
            رسالة الحل <span className="text-red-500">*</span>
          </label>
          <Textarea
            className="min-h-[120px]"
            placeholder="اشرح كيف تم حل المشكلة للعميل..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            dir="rtl"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                message.trim().length >= 10
                  ? "text-green-600"
                  : "text-portal-note-text"
              }
            >
              {message.trim().length}/10 أحرف على الأقل
            </span>
            <span className="text-portal-note-text">الحد الأقصى 1000 حرف</span>
          </div>
        </div>

        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !isValid}>
            {isLoading ? "جارٍ..." : (
              <>
                <Send data-icon="inline-start" />
                إرسال للتأكيد
              </>
            )}
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
