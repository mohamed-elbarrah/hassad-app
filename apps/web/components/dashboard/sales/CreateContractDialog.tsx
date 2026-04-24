"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { useCreateContractMutation } from "@/features/contracts/contractsApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";

const contractFormSchema = z.object({
  clientId: z.string().min(1, "اختر العميل"),
  services: z.string().min(2, "اكتب خدمة واحدة على الأقل"),
  value: z.number().positive("القيمة مطلوبة"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  fileUrl: z.string().url("رابط غير صالح").optional().or(z.literal("")),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

export function CreateContractDialog() {
  const [open, setOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [createContract, { isLoading }] = useCreateContractMutation();
  const { data: clientsData, isFetching: clientsFetching } = useGetClientsQuery(
    { search: clientSearch, limit: 20 },
    { skip: !open },
  );

  const clientOptions = (clientsData?.items ?? []).map((client) => ({
    id: client.id,
    label: client.name,
  }));

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientId: "",
      services: "",
      value: 0,
      startDate: "",
      endDate: "",
      fileUrl: "",
    },
  });

  async function onSubmit(values: ContractFormValues) {
    const services = values.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (services.length === 0) {
      toast.error("أضف خدمة واحدة على الأقل");
      return;
    }

    try {
      await createContract({
        clientId: values.clientId,
        services,
        value: values.value,
        startDate: values.startDate,
        endDate: values.endDate,
        fileUrl: values.fileUrl || undefined,
      }).unwrap();

      toast.success("تم إنشاء العقد بنجاح");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("فشل إنشاء العقد");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>إنشاء عقد</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>عقد جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العميل</FormLabel>
                  <FormControl>
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={clientOptions}
                      onSearchChange={setClientSearch}
                      placeholder="ابحث عن العميل..."
                      searchPlaceholder="اكتب اسم العميل"
                      isLoading={clientsFetching}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الخدمات</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="اكتب الخدمات المطلوبة مفصولة بفواصل"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قيمة العقد</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const nextValue = event.target.valueAsNumber;
                          field.onChange(
                            Number.isNaN(nextValue) ? undefined : nextValue,
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط العقد (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ البداية</FormLabel>
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
                    <FormLabel>تاريخ النهاية</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
