"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PipelineStage } from "@hassad/shared";
import type { Client } from "@hassad/shared";
import { useUpdateClientRequirementsMutation } from "@/features/clients/clientsApi";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const requirementsSchema = z.object({
  projectDescription: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  targetAudience: z.string().min(5, "يرجى وصف الجمهور المستهدف"),
  servicesNeeded: z.string().min(5, "يرجى تحديد الخدمات المطلوبة"),
  budgetRange: z.string().min(1, "يرجى تحديد نطاق الميزانية"),
  timeline: z.string().min(1, "يرجى تحديد الجدول الزمني"),
  specialRequirements: z.string().optional(),
});

type RequirementsFormValues = z.infer<typeof requirementsSchema>;

interface ClientWithRequirements {
  requirements?: Partial<RequirementsFormValues> | null;
}

interface RequirementsFormProps {
  client: Client;
}

export function RequirementsForm({ client }: RequirementsFormProps) {
  const [updateRequirements, { isLoading }] =
    useUpdateClientRequirementsMutation();
  const isEditable = client.stage === PipelineStage.REQUIREMENTS_GATHERING;
  const existingReqs = (client as unknown as ClientWithRequirements)
    .requirements;

  const form = useForm<RequirementsFormValues>({
    resolver: zodResolver(requirementsSchema),
    defaultValues: {
      projectDescription: existingReqs?.projectDescription ?? "",
      targetAudience: existingReqs?.targetAudience ?? "",
      servicesNeeded: existingReqs?.servicesNeeded ?? "",
      budgetRange: existingReqs?.budgetRange ?? "",
      timeline: existingReqs?.timeline ?? "",
      specialRequirements: existingReqs?.specialRequirements ?? "",
    },
  });

  useEffect(() => {
    if (existingReqs) {
      form.reset({
        projectDescription: existingReqs.projectDescription ?? "",
        targetAudience: existingReqs.targetAudience ?? "",
        servicesNeeded: existingReqs.servicesNeeded ?? "",
        budgetRange: existingReqs.budgetRange ?? "",
        timeline: existingReqs.timeline ?? "",
        specialRequirements: existingReqs.specialRequirements ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  async function onSubmit(values: RequirementsFormValues) {
    try {
      await updateRequirements({ id: client.id, body: values }).unwrap();
      toast.success("تم حفظ المتطلبات بنجاح");
    } catch {
      toast.error("فشل حفظ المتطلبات. يرجى المحاولة مجدداً.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">استمارة المتطلبات</CardTitle>
        <CardDescription>
          {isEditable
            ? "أدخل متطلبات العميل بالتفصيل لتتمكن من المتابعة للمرحلة التالية"
            : "لا يمكن تعديل المتطلبات إلا في مرحلة جمع المتطلبات"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف المشروع</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="اشرح طبيعة المشروع وأهدافه..."
                      disabled={!isEditable}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجمهور المستهدف</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: شباب 18-35"
                        disabled={!isEditable}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servicesNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الخدمات المطلوبة</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: إدارة سوشيال ميديا"
                        disabled={!isEditable}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budgetRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نطاق الميزانية</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: 5,000 - 10,000 ريال"
                        disabled={!isEditable}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الجدول الزمني</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: 3 أشهر"
                        disabled={!isEditable}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>متطلبات خاصة (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أي متطلبات إضافية..."
                      disabled={!isEditable}
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditable && (
              <div className="pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "جارٍ الحفظ..." : "حفظ المتطلبات"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
