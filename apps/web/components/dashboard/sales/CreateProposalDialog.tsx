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
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateProposalMutation } from "@/features/proposals/proposalsApi";
import { useGetLeadsQuery } from "@/features/leads/leadsApi";
import { SearchCombobox } from "@/components/common/SearchCombobox";

// ── Available platforms ───────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "Instagram", label: "Instagram" },
  { id: "TikTok", label: "TikTok" },
  { id: "Snapchat", label: "Snapchat" },
  { id: "Twitter/X", label: "Twitter/X" },
  { id: "LinkedIn", label: "LinkedIn" },
  { id: "Facebook", label: "Facebook" },
  { id: "Google", label: "Google" },
];

// ── Schema ────────────────────────────────────────────────────────────────────

const proposalFormSchema = z.object({
  leadId: z.string().min(1, "اختر العميل المحتمل"),
  title: z.string().min(2, "أدخل عنوان العرض"),
  serviceDescription: z.string().min(5, "اكتب وصفاً للخدمة"),
  servicesText: z
    .string()
    .min(2, "اكتب خدمة واحدة على الأقل (مفصولة بفاصلة)"),
  totalPrice: z.number().positive("السعر الإجمالي مطلوب"),
  durationDays: z
    .number()
    .int()
    .positive("المدة يجب أن تكون أيام صحيحة موجبة"),
  platforms: z
    .array(z.string())
    .min(1, "اختر منصة واحدة على الأقل"),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateProposalDialog() {
  const [open, setOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [createProposal, { isLoading }] = useCreateProposalMutation();

  const { data: leadsData, isFetching: leadsFetching } = useGetLeadsQuery(
    undefined,
    { skip: !open },
  );

  // Client-side filter on leads list
  const filteredLeads = (leadsData ?? []).filter(
    (l) =>
      !leadSearch ||
      l.companyName.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.contactName.toLowerCase().includes(leadSearch.toLowerCase()),
  );

  const leadOptions = filteredLeads.map((l) => ({
    id: l.id,
    label: `${l.companyName} — ${l.contactName}`,
  }));

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      leadId: "",
      title: "",
      serviceDescription: "",
      servicesText: "",
      totalPrice: 0,
      durationDays: 30,
      platforms: [],
    },
  });

  async function onSubmit(values: ProposalFormValues) {
    const servicesList = values.servicesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    if (servicesList.length === 0) {
      toast.error("أضف خدمة واحدة على الأقل");
      return;
    }

    try {
      await createProposal({
        leadId: values.leadId,
        title: values.title,
        serviceDescription: values.serviceDescription,
        servicesList,
        totalPrice: values.totalPrice,
        durationDays: values.durationDays,
        platforms: values.platforms,
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
            {/* Lead */}
            <FormField
              control={form.control}
              name="leadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العميل المحتمل</FormLabel>
                  <FormControl>
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={leadOptions}
                      onSearchChange={setLeadSearch}
                      placeholder="ابحث عن عميل..."
                      searchPlaceholder="اكتب اسم الشركة أو العميل"
                      isLoading={leadsFetching}
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
                  <FormLabel>عنوان العرض</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="باقة إدارة وسائل التواصل الاجتماعي"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service description */}
            <FormField
              control={form.control}
              name="serviceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف الخدمة</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="وصف مختصر للخدمات المقدمة..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Services list */}
            <FormField
              control={form.control}
              name="servicesText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>قائمة الخدمات (مفصولة بفاصلة)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="تصميم المحتوى, إدارة الحسابات, التقارير الشهرية"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="totalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر الإجمالي (ر.س)</FormLabel>
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
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المدة (بالأيام)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
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

            {/* Platforms */}
            <FormField
              control={form.control}
              name="platforms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المنصات</FormLabel>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {PLATFORMS.map((p) => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <Checkbox
                          id={`platform-${p.id}`}
                          checked={field.value.includes(p.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, p.id]);
                            } else {
                              field.onChange(
                                field.value.filter((v) => v !== p.id),
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`platform-${p.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {p.label}
                        </label>
                      </div>
                    ))}
                  </div>
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
