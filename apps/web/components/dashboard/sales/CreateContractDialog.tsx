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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
import { useCreateContractMutation } from "@/features/contracts/contractsApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";
import { ContractType } from "@hassad/shared";

// ── Labels ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ContractType, string> = {
  [ContractType.ONE_TIME_SERVICE]: "مرة واحدة",
  [ContractType.MONTHLY_RETAINER]: "اشتراك شهري",
  [ContractType.FIXED_PROJECT]: "مشروع محدد",
};

// ── Schema ─────────────────────────────────────────────────────────────────────

const contractFormSchema = z.object({
  clientId: z.string().min(1, "اختر العميل"),
  title: z.string().min(2, "اكتب عنوان العقد"),
  type: z.nativeEnum(ContractType, { message: "اختر نوع العقد" }),
  monthlyValue: z.number().nonnegative("القيمة الشهرية مطلوبة"),
  totalValue: z.number().positive("إجمالي القيمة مطلوب"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

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
    label: client.companyName,
  }));

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientId: "",
      title: "",
      type: undefined,
      monthlyValue: 0,
      totalValue: 0,
      startDate: "",
      endDate: "",
    },
  });

  async function onSubmit(values: ContractFormValues) {
    try {
      await createContract({
        clientId: values.clientId,
        title: values.title,
        type: values.type,
        monthlyValue: values.monthlyValue,
        totalValue: values.totalValue,
        startDate: values.startDate,
        endDate: values.endDate,
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
            {/* Client */}
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
                      searchPlaceholder="اكتب اسم الشركة"
                      isLoading={clientsFetching}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان العقد</FormLabel>
                  <FormControl>
                    <Input placeholder="عقد خدمات التسويق..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع العقد</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.values(ContractType) as ContractType[]).map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABELS[t]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Values */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="monthlyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القيمة الشهرية (ر.س)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          field.onChange(Number.isNaN(n) ? undefined : n);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إجمالي القيمة (ر.س)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          field.onChange(Number.isNaN(n) ? undefined : n);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
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
