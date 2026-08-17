"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { UserRole, BusinessType, CreateClientSchema } from "@hassad/shared";
import type { CreateClientInput } from "@hassad/shared";

import { useCreateClientMutation } from "@/features/clients/clientsApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { useAppSelector } from "@/lib/hooks";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  [BusinessType.RESTAURANT]: "مطعم",
  [BusinessType.CLINIC]: "عيادة",
  [BusinessType.STORE]: "متجر",
  [BusinessType.SERVICE]: "خدمة",
  [BusinessType.OTHER]: "أخرى",
};

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({
  open,
  onOpenChange,
}: CreateClientDialogProps) {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === UserRole.ADMIN;
  const [createClient, { isLoading }] = useCreateClientMutation();

  const { data: salesUsers } = useSearchUsersQuery(
    { role: UserRole.SALES, limit: 50 },
    { skip: !isAdmin || !open },
  );

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(CreateClientSchema),
    mode: "onChange",
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

  useEffect(() => {
    if (!open) form.reset();
  }, [form, open]);

  async function onSubmit(values: CreateClientInput) {
    try {
      await createClient(values).unwrap();
      toast.success("تم إضافة العميل بنجاح");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("فشل إضافة العميل. يرجى المحاولة مجدداً.");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            إضافة عميل جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات العميل الجديد لإضافته إلى المنصة.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>اسم الشركة</FormLabel>
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
                    <FormLabel>اسم جهة الاتصال</FormLabel>
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
                    <FormLabel>رقم الواتساب</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="+966 5x xxx xxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>البريد الإلكتروني</FormLabel>
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

            <div className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="size-4" />
              النشاط التجاري
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>اسم النشاط التجاري</FormLabel>
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
                    <FormLabel>نوع النشاط</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
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

              {isAdmin ? (
                <FormField
                  control={form.control}
                  name="accountManager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدير الحساب</FormLabel>
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
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={!form.formState.isValid || isLoading}>
                {isLoading ? "جارٍ الحفظ..." : "إضافة العميل"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
