"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSendSalesContractMutation } from "@/features/contracts/contractsApi";
import { salesWorkflowErrorMessage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface SalesContractSendActionProps {
  contractId: string;
  label?: string;
  size?: "default" | "sm";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function SalesContractSendAction({
  contractId,
  label = "إرسال العقد",
  size = "sm",
  variant = "outline",
  className,
}: SalesContractSendActionProps) {
  const [sendContract, { isLoading }] = useSendSalesContractMutation();
  const [confirming, setConfirming] = useState(false);

  async function handleSend() {
    try {
      await sendContract(contractId).unwrap();
      setConfirming(false);
      toast.success("تم إرسال العقد إلى العميل");
    } catch (error) {
      toast.error(salesWorkflowErrorMessage(error));
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("min-h-11", className)}
        disabled={isLoading}
        onClick={() => setConfirming(true)}
      >
        {isLoading ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Send data-icon="inline-start" />
        )}
        {isLoading ? "جارٍ الإرسال" : label}
      </Button>
      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!isLoading) setConfirming(open);
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إرسال العقد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إرسال العقد إلى العميل ليبدأ التوقيع الإلكتروني.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={(event) => {
                event.preventDefault();
                void handleSend();
              }}
            >
              {isLoading ? "جارٍ الإرسال" : "تأكيد وإرسال"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
