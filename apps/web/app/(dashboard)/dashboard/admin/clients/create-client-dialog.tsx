"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import { ClientInvitationLinkDialog } from "@/components/client-onboarding/ClientInvitationLinkDialog";
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
import { UserRole } from "@hassad/shared";

import {
  useCreateAdminClientMutation,
  type AdminCreateClientInput,
} from "@/features/admin/adminClientsApi";
import { useGetAdminUsersQuery } from "@/features/admin/adminUsersApi";
import { useAppSelector } from "@/lib/hooks";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";

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
  const [createClient, { isLoading }] = useCreateAdminClientMutation();
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  const { data: salesUsers } = useGetAdminUsersQuery(
    { roles: UserRole.SALES, limit: 50 },
    { skip: !isAdmin || !open },
  );

  const form = useForm<AdminCreateClientInput>({
    resolver: zodResolver(
      z.object({
        email: z.string().trim().email("أدخل بريداً إلكترونياً صحيحاً"),
        phoneWhatsapp: z
          .string()
          .trim()
          .regex(/^[0-9+()\s.-]{7,30}$/, "أدخل رقم واتساب صحيحاً"),
        accountManager: z.string().uuid().optional(),
      }),
    ) as unknown as Resolver<AdminCreateClientInput>,
    mode: "onChange",
    defaultValues: {
      phoneWhatsapp: "",
      email: "",
      accountManager: undefined,
    },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [form, open]);

  async function onSubmit(values: AdminCreateClientInput) {
    try {
      const result = await createClient(values).unwrap();
      toast.success(adminSuccessMessage(result.code));
      setSetupUrl(result.invitation.setupUrl);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(adminErrorMessage(error));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  }

  return (
    <>
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || isLoading}
              >
                {isLoading ? "جارٍ الحفظ..." : "إضافة العميل"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      </Dialog>
      <ClientInvitationLinkDialog
      key={setupUrl ?? "empty"}
      open={Boolean(setupUrl)}
      setupUrl={setupUrl}
      onOpenChange={(open) => {
        if (!open) setSetupUrl(null);
      }}
      />
    </>
  );
}
