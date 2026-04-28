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
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { useAppSelector } from "@/lib/hooks";
import {
  CreateClientSchema,
  BusinessType,
  UserRole,
} from "@hassad/shared";
import type { CreateClientInput } from "@hassad/shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateClientDialog() {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === UserRole.ADMIN;
  const [open, setOpen] = useState(false);
  const [createClient, { isLoading }] = useCreateClientMutation();
  const { data: salesUsers } = useSearchUsersQuery(
    { role: UserRole.SALES, limit: 50 },
    { skip: !isAdmin || !open },
  );

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      phoneWhatsapp: "",
      email: "",
      businessName: "",
      businessType: undefined,
      accountManager: undefined,
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
            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الشركة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: شركة النجوم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Name */}
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم جهة الاتصال</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم الكامل للمسؤول" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone (WhatsApp) */}
            <FormField
              control={form.control}
              name="phoneWhatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الواتساب</FormLabel>
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

            {/* Business Name */}
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم النشاط التجاري</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم التجاري المعروف به" {...field} />
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
                  <FormLabel>نوع النشاط</FormLabel>
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

            {/* Account Manager (admin only) */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="accountManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدير الحساب (اختياري)</FormLabel>
                    <Select
                      value={field.value ?? "AUTO"}
                      onValueChange={(value) =>
                        field.onChange(value === "AUTO" ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="تعيين تلقائي" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AUTO">تعيين تلقائي</SelectItem>
                        {(salesUsers?.items ?? []).map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
