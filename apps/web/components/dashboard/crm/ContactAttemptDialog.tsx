"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ContactOutcome } from "@hassad/shared";
import { useLogContactAttemptMutation } from "@/features/clients/clientsApi";

const contactAttemptSchema = z.object({
  outcome: z.nativeEnum(ContactOutcome),
  notes: z.string().optional(),
});

type ContactAttemptValues = z.infer<typeof contactAttemptSchema>;

const OUTCOME_LABELS: Record<ContactOutcome, string> = {
  [ContactOutcome.NO_RESPONSE]: "لا يوجد رد",
  [ContactOutcome.RESPONDED]: "تم الرد",
};

interface ContactAttemptDialogProps {
  clientId: string;
  clientName: string;
}

export function ContactAttemptDialog({
  clientId,
  clientName,
}: ContactAttemptDialogProps) {
  const [open, setOpen] = useState(false);
  const [logAttempt, { isLoading }] = useLogContactAttemptMutation();

  const form = useForm<ContactAttemptValues>({
    resolver: zodResolver(contactAttemptSchema),
    defaultValues: {
      outcome: ContactOutcome.NO_RESPONSE,
      notes: "",
    },
  });

  async function onSubmit(values: ContactAttemptValues) {
    try {
      await logAttempt({
        id: clientId,
        body: { outcome: values.outcome, notes: values.notes || undefined },
      }).unwrap();

      toast.success(`تم تسجيل محاولة التواصل مع ${clientName}.`);
      form.reset();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل تسجيل محاولة التواصل";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          تسجيل محاولة تواصل
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل محاولة تواصل</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نتيجة المحاولة</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النتيجة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.values(ContactOutcome) as ContactOutcome[]).map(
                        (outcome) => (
                          <SelectItem key={outcome} value={outcome}>
                            {OUTCOME_LABELS[outcome]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="تفاصيل إضافية عن المحاولة"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
