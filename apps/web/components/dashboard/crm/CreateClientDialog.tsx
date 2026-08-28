"use client";

import { Input } from "@/components/ui/input";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Briefcase } from "lucide-react";
import { Dialog } from "@/components/design-system/Dialog";
import { ActionButton } from "@/components/design-system/ActionButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
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
import { CreateClientSchema, BusinessType, UserRole } from "@hassad/shared";
import type { CreateClientInput } from "@hassad/shared";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientModal({ open, onOpenChange }: Props) {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === UserRole.ADMIN;
  const [createClient, { isLoading }] = useCreateClientMutation();
  const { data: salesUsers } = useSearchUsersQuery(
    { role: UserRole.SALES, limit: 50 },
    { skip: !isAdmin || !open },
  );

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(CreateClientSchema) as unknown as Resolver<CreateClientInput>,
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
      onOpenChange(false);
    } catch {
      toast.error("فشل إضافة العميل. يرجى المحاولة مجدداً.");
    }
  }

  function handleClose(v: boolean) {
    if (!v) form.reset();
    onOpenChange(v);
  }

  const isValid = form.formState.isValid;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      contentClassName="sm:max-w-[480px]"
    >
      <div className="text-center space-y-1.5 pb-4">
        <div className="flex justify-center mb-3">
          <div className="h-14 w-14 rounded-full bg-secondary-500/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-secondary-500" />
          </div>
        </div>
        <h1 className="text-[22px] font-bold text-natural-100 leading-tight">
          إضافة عميل جديد
        </h1>
        <p className="text-[13px] text-neutral-300 leading-relaxed px-2">
          أدخل بيانات العميل الجديد لإضافته إلى المنصة
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="border border-neutral-200 rounded-2xl p-5 space-y-4 bg-natural-0">
            <p className="text-[15px] font-bold text-natural-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary-500" />
              بيانات العميل
            </p>

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <label className="text-[13px] font-bold text-natural-100 block">
                    اسم الشركة <span className="text-danger-500">*</span>
                  </label>
                  <FormControl>
                    <Input placeholder="مثال: شركة النجوم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <label className="text-[13px] font-bold text-natural-100 block">
                    اسم جهة الاتصال <span className="text-danger-500">*</span>
                  </label>
                  <FormControl>
                    <Input placeholder="الاسم الكامل للمسؤول" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneWhatsapp"
              render={({ field }) => (
                <FormItem>
                  <label className="text-[13px] font-bold text-natural-100 block">
                    رقم الواتساب <span className="text-danger-500">*</span>
                  </label>
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <label className="text-[13px] font-bold text-natural-100 block">
                    البريد الإلكتروني{" "}
                    <span className="text-neutral-300 text-[12px]">
                      (اختياري)
                    </span>
                  </label>
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
          </div>

          <div className="border border-neutral-200 rounded-2xl p-5 space-y-4 bg-natural-0">
            <p className="text-[15px] font-bold text-natural-100 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-secondary-500" />
              النشاط التجاري
            </p>

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <label className="text-[13px] font-bold text-natural-100 block">
                    اسم النشاط التجاري{" "}
                    <span className="text-neutral-300 text-[12px]">
                      (اختياري)
                    </span>
                  </label>
                  <FormControl>
                    <Input placeholder="الاسم التجاري المعروف به" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <label className="text-[13px] font-bold text-natural-100 block">
                    نوع النشاط <span className="text-danger-500">*</span>
                  </label>
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

            {isAdmin && (
              <FormField
                control={form.control}
                name="accountManager"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-[13px] font-bold text-natural-100 block">
                      مدير الحساب{" "}
                      <span className="text-neutral-300 text-[12px]">
                        (اختياري)
                      </span>
                    </label>
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
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-danger-500">
              {form.formState.errors.root.message}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <ActionButton
              variant="outline"
              type="button"
              onClick={() => handleClose(false)}
              className="w-[30%] h-14 text-[13px] font-medium"
            >
              إلغاء
            </ActionButton>
            <ActionButton
              type="submit"
              variant="submit"
              size="lg"
              loading={isLoading}
              disabled={!isValid}
              className="flex-1 h-14 text-[15px] font-semibold"
            >
              {isLoading ? "جارٍ الحفظ..." : "إضافة العميل"}
            </ActionButton>
          </div>
        </form>
      </Form>
    </Dialog>
  );
}
