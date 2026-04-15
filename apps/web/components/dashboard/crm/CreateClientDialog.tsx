"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateClientMutation } from "@/features/clients/clientsApi";
import { CreateClientSchema, BusinessType, ClientSource } from "@hassad/shared";
import type { CreateClientInput } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
};

const SOURCE_LABELS: Record<ClientSource, string> = {
  [ClientSource.AD]: "إعلان",
  [ClientSource.REFERRAL]: "إحالة",
  [ClientSource.WEBSITE]: "الموقع الإلكتروني",
  [ClientSource.WHATSAPP]: "واتساب",
  [ClientSource.PLATFORM]: "المنصة",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [createClient, { isLoading }] = useCreateClientMutation();

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      businessType: undefined,
      source: undefined,
    },
  });

  async function onSubmit(values: CreateClientInput) {
    try {
      await createClient(values).unwrap();
      toast.success("تم إضافة العميل بنجاح.");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("فشل إضافة العميل. يرجى المحاولة مجدداً.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة عميل
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة عميل جديد</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم العميل أو الشركة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      placeholder="+966 5x xxx xxxx"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (optional) */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Type */}
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع النشاط التجاري</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.values(BusinessType) as BusinessType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {BUSINESS_TYPE_LABELS[type]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مصدر العميل</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المصدر" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.values(ClientSource) as ClientSource[]).map(
                        (src) => (
                          <SelectItem key={src} value={src}>
                            {SOURCE_LABELS[src]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Root error */}
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
