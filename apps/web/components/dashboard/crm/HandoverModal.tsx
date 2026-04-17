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
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { useHandoverClientMutation } from "@/features/clients/clientsApi";
import { useSearchUsersQuery } from "@/features/users/usersApi";
import { SearchCombobox } from "@/components/dashboard/pm/SearchCombobox";
import { UserRole } from "@hassad/shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const HandoverSchema = z.object({
  name: z.string().min(2, "اسم المشروع يجب أن يكون حرفين على الأقل"),
  managerId: z.string().min(1, "مدير المشروع مطلوب"),
  startDate: z.string().min(1, "تاريخ البدء مطلوب"),
  endDate: z.string().min(1, "تاريخ الانتهاء مطلوب"),
});

type HandoverFormValues = z.infer<typeof HandoverSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface HandoverModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** The client being handed over */
  client: { id: string; name: string };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HandoverModal({ open, onClose, client }: HandoverModalProps) {
  const [managerSearch, setManagerSearch] = useState("");

  const [handover, { isLoading }] = useHandoverClientMutation();

  const { data: usersData, isFetching: usersFetching } = useSearchUsersQuery(
    { search: managerSearch, role: UserRole.PM, limit: 20 },
    { skip: !open },
  );

  const managerOptions = (usersData?.items ?? []).map((u) => ({
    id: u.id,
    label: u.name,
  }));

  const form = useForm<HandoverFormValues>({
    resolver: zodResolver(HandoverSchema),
    defaultValues: {
      name: `مشروع — ${client.name}`,
      managerId: "",
      startDate: "",
      endDate: "",
    },
  });

  // Re-set name default when client changes (in case modal is reused)
  const watchedName = form.watch("name");
  if (open && watchedName === "") {
    form.setValue("name", `مشروع — ${client.name}`);
  }

  async function onSubmit(values: HandoverFormValues) {
    try {
      await handover({
        id: client.id,
        body: {
          name: values.name,
          managerId: values.managerId,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
        },
      }).unwrap();

      toast.success(`تم تسليم العميل "${client.name}" وإنشاء المشروع بنجاح.`);
      form.reset();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "فشل عملية التسليم. يرجى المحاولة مجدداً.";
      toast.error(message);
    }
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      form.reset({
        name: `مشروع — ${client.name}`,
        managerId: "",
        startDate: "",
        endDate: "",
      });
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسليم العميل للعمليات</DialogTitle>
          <DialogDescription>
            سيتم نقل <strong>{client.name}</strong> إلى مرحلة التسليم وإنشاء
            مشروع جديد تلقائياً.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            {/* Project name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المشروع</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم المشروع" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manager combobox */}
            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدير المشروع</FormLabel>
                  <FormControl>
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={managerOptions}
                      onSearchChange={setManagerSearch}
                      placeholder="ابحث عن مدير المشروع..."
                      searchPlaceholder="اكتب اسم المدير"
                      isLoading={usersFetching}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البدء</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الانتهاء</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ التسليم..." : "تأكيد التسليم"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
