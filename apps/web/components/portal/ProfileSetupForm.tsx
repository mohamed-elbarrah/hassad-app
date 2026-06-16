"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpsertClientProfileSchema, type UpsertClientProfileInput } from "@hassad/shared";
import { useUpsertClientProfileMutation } from "@/features/clients/clientsApi";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { updateUser } from "@/features/auth/authSlice";
import { ActionButton } from "@/components/design-system/ActionButton";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { FormTextareaControl } from "@/components/design-system/FormTextareaControl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { toast } from "sonner";
import { Loader2, Building2, Target, DollarSign, Globe, MessageCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const COMMS_OPTIONS = [
  { value: "whatsapp", label: "واتساب" },
  { value: "email", label: "البريد الإلكتروني" },
  { value: "phone", label: "الهاتف" },
  { value: "chat", label: "المحادثة المباشرة" },
] as const;

interface ProfileSetupFormProps {
  onSuccess: () => void;
}

export function ProfileSetupForm({ onSuccess }: ProfileSetupFormProps) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [upsertProfile, { isLoading }] = useUpsertClientProfileMutation();

  const form = useForm<UpsertClientProfileInput>({
    resolver: zodResolver(UpsertClientProfileSchema),
    defaultValues: {
      industry: "",
      businessDescription: "",
      targetAudience: "",
      budgetRangeMin: undefined,
      budgetRangeMax: undefined,
      preferredPlatforms: "",
      communicationPreference: undefined,
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const onSubmit = useCallback(
    async (values: UpsertClientProfileInput) => {
      if (!user?.clientId) {
        toast.error("لم يتم ربط حسابك بعميل. يرجى التواصل مع الإدارة.");
        return;
      }

      try {
        await upsertProfile({
          id: user.clientId,
          data: values,
        }).unwrap();

        dispatch(updateUser({ intakeCompleted: true }));
        toast.success("تم حفظ الملف التعريفي بنجاح! جارٍ تحويلك إلى لوحة التحكم...");
        onSuccess();
      } catch (err: unknown) {
        const error = err as { data?: { message?: string | string[] } };
        const msg = error?.data?.message;
        toast.error(
          Array.isArray(msg) ? msg.join("; ") : msg || "حدث خطأ. يرجى المحاولة مرة أخرى.",
        );
      }
    },
    [upsertProfile, user?.clientId, dispatch, onSuccess],
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <FormField
          control={form.control}
          name="industry"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-neutral-400" />
                المجال / النشاط التجاري
                <span className="text-danger-500">*</span>
              </FormLabel>
              <FormControl>
                <FormInputControl
                  placeholder="مثال: تسويق إلكتروني، مطاعم، عيادات..."
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-neutral-400" />
                وصف النشاط التجاري
              </FormLabel>
              <FormControl>
                <FormTextareaControl
                  placeholder="اخبرنا باختصار عن نشاطك التجاري، ماذا تقدم، وما هي أهدافك..."
                  className="resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-neutral-400" />
                الجمهور المستهدف
              </FormLabel>
              <FormControl>
                <FormTextareaControl
                  placeholder="من هم عملاؤك المستهدفون؟ (فئة عمرية، منطقة جغرافية، اهتمامات...)"
                  className="resize-none h-20"
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
            name="budgetRangeMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-neutral-400" />
                  الميزانية من
                </FormLabel>
                <FormControl>
                  <FormInputControl
                    type="number"
                    placeholder="0"
                    min={0}
                    dir="ltr"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetRangeMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-neutral-400" />
                  الميزانية إلى
                </FormLabel>
                <FormControl>
                  <FormInputControl
                    type="number"
                    placeholder="0"
                    min={0}
                    dir="ltr"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="preferredPlatforms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-neutral-400" />
                المنصات المفضلة
              </FormLabel>
              <FormControl>
                <FormInputControl
                  placeholder="مثال: انستغرام، جوجل، تيك توك، سناب شات..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="communicationPreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-neutral-400" />
                وسيلة التواصل المفضلة
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <select
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val || undefined);
                    }}
                    className={cn(
                      "flex h-11 w-full items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-right appearance-none",
                      "focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:border-secondary-500",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      !field.value && "text-neutral-400",
                    )}
                  >
                    <option value="" disabled>
                      اختر وسيلة التواصل المفضلة
                    </option>
                    {COMMS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4 pt-6 border-t border-neutral-100">
          <ActionButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              "حفظ والمتابعة إلى لوحة التحكم 🚀"
            )}
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}
