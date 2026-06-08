"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import {
  FormSelect,
  FormSelectContent,
  FormSelectItem,
  FormSelectTrigger,
  FormSelectValue,
} from "@/components/design-system/FormSelectControl";
import { useCreateClientMutation } from "@/features/clients/clientsApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { useAppSelector } from "@/lib/hooks";
import { CreateClientSchema, BusinessType, UserRole } from "@hassad/shared";
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
    <>
      <ActionButton
        variant="primary"
        onClick={() => setOpen(true)}
        icon={<Plus className="h-4 w-4" />}
      >
        إضافة عميل
      </ActionButton>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="إضافة عميل جديد"
        contentClassName="sm:max-w-md"
      >
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
                    <FormInputControl
                      placeholder="مثال: شركة النجوم"
                      {...field}
                    />
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
                    <FormInputControl
                      placeholder="الاسم الكامل للمسؤول"
                      {...field}
                    />
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
                    <FormInputControl
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
                    <FormInputControl
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
                    <FormInputControl
                      placeholder="الاسم التجاري المعروف به"
                      {...field}
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
                  <FormLabel>نوع النشاط</FormLabel>
                  <FormSelect
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <FormSelectTrigger>
                        <FormSelectValue placeholder="اختر النوع" />
                      </FormSelectTrigger>
                    </FormControl>
                    <FormSelectContent>
                      {(Object.values(BusinessType) as BusinessType[]).map(
                        (type) => (
                          <FormSelectItem key={type} value={type}>
                            {BUSINESS_TYPE_LABELS[type]}
                          </FormSelectItem>
                        ),
                      )}
                    </FormSelectContent>
                  </FormSelect>
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
                    <FormSelect
                      value={field.value ?? "AUTO"}
                      onValueChange={(value) =>
                        field.onChange(value === "AUTO" ? undefined : value)
                      }
                    >
                      <FormControl>
                        <FormSelectTrigger>
                          <FormSelectValue placeholder="تعيين تلقائي" />
                        </FormSelectTrigger>
                      </FormControl>
                      <FormSelectContent>
                        <FormSelectItem value="AUTO">
                          تعيين تلقائي
                        </FormSelectItem>
                        {(salesUsers?.items ?? []).map((staff) => (
                          <FormSelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </FormSelectItem>
                        ))}
                      </FormSelectContent>
                    </FormSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.formState.errors.root && (
              <p className="text-sm text-danger-500">
                {form.formState.errors.root.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </ActionButton>
              <ActionButton type="submit" variant="primary" loading={isLoading}>
                {isLoading ? "جارٍ الحفظ..." : "حفظ"}
              </ActionButton>
            </div>
          </form>
        </Form>
      </Dialog>
    </>
  );
}
