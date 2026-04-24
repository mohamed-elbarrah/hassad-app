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
import { useCreateProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";

const proposalFormSchema = z.object({
  clientId: z.string().min(1, "اختر العميل"),
  services: z.string().min(2, "اكتب خدمة واحدة على الأقل"),
  price: z.number().positive("السعر مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  notes: z.string().optional(),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export function CreateProposalDialog() {
  const [open, setOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [createProposal, { isLoading }] = useCreateProposalMutation();
  const { data: clientsData, isFetching: clientsFetching } = useGetClientsQuery(
    { search: clientSearch, limit: 20 },
    { skip: !open },
  );

  const clientOptions = (clientsData?.items ?? []).map((client) => ({
    id: client.id,
    label: client.name,
  }));

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      clientId: "",
      services: "",
      price: 0,
      startDate: "",
      notes: "",
    },
  });

  async function onSubmit(values: ProposalFormValues) {
    const services = values.services
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (services.length === 0) {
      toast.error("أضف خدمة واحدة على الأقل");
      return;
    }

    try {
      await createProposal({
        clientId: values.clientId,
        services,
        price: values.price,
        startDate: values.startDate,
        notes: values.notes || undefined,
      }).unwrap();

      toast.success("تم إنشاء العرض الفني بنجاح");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("فشل إنشاء العرض الفني");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>إنشاء عرض فني</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>عرض فني جديد</DialogTitle>
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
