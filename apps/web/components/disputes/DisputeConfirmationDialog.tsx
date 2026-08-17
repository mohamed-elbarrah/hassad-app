"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DisputeConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  onEscalate: (feedback: string) => void;
  isLoading?: boolean;
  pmName: string;
}

export function DisputeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onEscalate,
  isLoading = false,
  pmName,
}: DisputeConfirmationDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState<
    "confirm" | "escalate" | null
  >(null);

  const handleConfirm = () => {
    onConfirm(feedback);
    setFeedback("");
    setShowFeedback(null);
  };

  const handleEscalate = () => {
    onEscalate(feedback);
    setFeedback("");
    setShowFeedback(null);
  };

  const handleClose = () => {
    if (isLoading) return;
    setFeedback("");
    setShowFeedback(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-6 pb-0 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
            <AlertTriangle className="h-8 w-8 text-warning-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">
            هل تم حل المشكلة؟
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {pmName} أشار إلى أن المشكلة قد تم حلها. هل توافق على ذلك؟
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 p-6">
          {!showFeedback ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFeedback("escalate")}
                disabled={isLoading}
                className="h-auto flex-col gap-2 rounded-xl border-danger-300 p-4 hover:bg-danger-100/60 hover:text-danger-800"
              >
                <XCircle className="h-6 w-6 text-danger-500" />
                <span className="text-sm font-medium">لم يتم الحل</span>
                <span className="text-xs text-muted-foreground">
                  سيتم تصعيد التذكرة للإدارة
                </span>
              </Button>

              <Button
                onClick={() => setShowFeedback("confirm")}
                disabled={isLoading}
                className="h-auto flex-col gap-2 rounded-xl bg-success-500 hover:bg-success-600 p-4"
              >
                <CheckCircle2 className="h-6 w-6 text-white" />
                <span className="text-sm font-medium">نعم، تم الحل</span>
                <span className="text-xs text-success-100">
                  سيتم إغلاق التذكرة
                </span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {showFeedback === "confirm"
                    ? "ملاحظاتك على الحل (اختياري)"
                    : "سبب عدم الحل (اختياري)"}
                </p>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    showFeedback === "confirm"
                      ? "اكتب ملاحظاتك حول الحل..."
                      : "اشرح سبب عدم حل المشكلة..."
                  }
                  disabled={isLoading}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(null)}
                  disabled={isLoading}
                  className="rounded-xl"
                >
                  رجوع
                </Button>
                <Button
                  onClick={
                    showFeedback === "confirm" ? handleConfirm : handleEscalate
                  }
                  disabled={isLoading}
                  className={
                    showFeedback === "confirm"
                      ? "rounded-xl bg-success-500 hover:bg-success-600"
                      : "rounded-xl bg-danger-500 hover:bg-danger-600"
                  }
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      جاري المعالجة...
                    </>
                  ) : showFeedback === "confirm" ? (
                    "تأكيد الحل"
                  ) : (
                    "تصعيد للإدارة"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
