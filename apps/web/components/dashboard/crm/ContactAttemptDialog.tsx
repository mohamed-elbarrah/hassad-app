"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ContactAttemptDialogProps {
  clientId: string;
  clientName: string;
}

export function ContactAttemptDialog({
  clientName,
}: ContactAttemptDialogProps) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          تسجيل محاولة تواصل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل محاولة تواصل — {clientName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground text-center">
          هذه الميزة متاحة فقط من صفحة العميل المحتمل (Leads).
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => {
            setOpen(false);
            toast.info("انتقل إلى صفحة العميل المحتمل لتسجيل محاولة التواصل.");
          }}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
