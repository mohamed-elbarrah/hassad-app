"use client";

import { useId, useState } from "react";
import { ContactLogResult, ContactLogType } from "@hassad/shared";
import type { CreateRequestContactLogPayload } from "@/features/requests/requestsApi";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requestContactResultLabel, requestContactTypeLabel } from "@/lib/i18n";

interface RequestContactLogDialogProps {
  disabled?: boolean;
  isSubmitting?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  allowedTypes?: readonly ContactLogType[];
  onSubmit: (payload: CreateRequestContactLogPayload) => Promise<void>;
}

export function RequestContactLogDialog({
  disabled,
  isSubmitting,
  variant = "outline",
  size = "default",
  allowedTypes = Object.values(ContactLogType),
  onSubmit,
}: RequestContactLogDialogProps) {
  const id = useId();
  const typeOptions =
    allowedTypes.length > 0 ? allowedTypes : [ContactLogType.CALL];
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContactLogType>(typeOptions[0]);
  const [result, setResult] = useState<ContactLogResult>(
    ContactLogResult.RESPONDED,
  );
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    await onSubmit({
      type,
      result,
      notes: notes.trim() || undefined,
    });
    setNotes("");
    setType(typeOptions[0]);
    setResult(ContactLogResult.RESPONDED);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isSubmitting}
        >
          تسجيل تواصل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل تواصل جديد</DialogTitle>
          <DialogDescription>
            سجّل نوع التواصل ونتيجته مع هذا العميل المحتمل.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-type`}>نوع التواصل</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as ContactLogType)}
              >
                <SelectTrigger id={`${id}-type`}>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {typeOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {requestContactTypeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${id}-result`}>النتيجة</Label>
              <Select
                value={result}
                onValueChange={(value) => setResult(value as ContactLogResult)}
              >
                <SelectTrigger id={`${id}-result`}>
                  <SelectValue placeholder="اختر النتيجة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.values(ContactLogResult).map((value) => (
                      <SelectItem key={value} value={value}>
                        {requestContactResultLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-notes`}>ملاحظات</Label>
            <Textarea
              id={`${id}-notes`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="اكتب ملخصًا قصيرًا لما حدث في هذا التواصل"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "جارٍ الحفظ..." : "حفظ التواصل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
