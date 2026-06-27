/**
 * PersonalInfoSection - Step 1: Personal Identity
 *
 * Collects and edits the logged-in user's personal identity (name, email,
 * phone). Writes directly to the `User` table via `PATCH /v1/users/:id`,
 * which is the single source of truth for personal identity across the
 * platform.
 *
 * Why this section exists separately from `CommunicationSection`:
 * - `User` owns personal identity (name, email, phoneWhatsapp, avatar).
 * - `ClientProfile.communicationInfo` owns marketing/wizard data
 *   (businessName, industry) — it must NOT contain copies of personal
 *   identity fields. This separation eliminates the three-table
 *   duplication that previously caused `/portal/account` and
 *   `/portal/profile` to show different names for the same person.
 *
 * Modes:
 * - wizard: Step-by-step onboarding. Pre-fills from auth state, lets
 *   the user verify or correct their email/phone, writes to `User`.
 * - edit: Profile editor. Same pre-fill + write behavior.
 * - view: Read-only display. Reads from auth state directly (no fetch).
 */

"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/design-system/Form";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import { User, Mail, Phone } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import { useUpdateUserMutation } from "@/features/users/usersApi";
import { SectionLayout, NavigationButtons } from "../SectionLayout";
import type { ProfileMode } from "../types";

// ── Schema ────────────────────────────────────────────────────────────────
//
// We keep email optional in the wizard so the user can choose to keep
// their CRM-assigned email. Name is required (we never allow an empty
// display name). Phone is optional.
const PersonalInfoSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phoneWhatsapp: z.string().optional().or(z.literal("")),
});

type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

interface PersonalInfoSectionProps {
  mode: ProfileMode;
  /** Called when the user saves changes. Returns a promise so the
   *  wizard can await it before navigating to the next step. */
  onSave?: (data: PersonalInfo) => Promise<void> | void;
  /** Called when form validity changes (wizard/edit mode only). */
  onValid?: (isValid: boolean) => void;
  /** Wizard navigation. */
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
}

export function PersonalInfoSection({
  mode,
  onSave,
  onValid,
  onNext,
  onBack,
  hideNavigation = false,
}: PersonalInfoSectionProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const form = useForm<PersonalInfo>({
    resolver: zodResolver(PersonalInfoSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phoneWhatsapp: user?.phoneWhatsapp ?? "",
    },
    mode: "onChange",
  });

  // Reset when the auth user changes (e.g., after a save round-trip).
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        email: user.email ?? "",
        phoneWhatsapp: user.phoneWhatsapp ?? "",
      });
    }
  }, [user, form]);

  useEffect(() => {
    onValid?.(form.formState.isValid);
  }, [form.formState.isValid, onValid]);

  const onSubmit = useCallback(
    async (data: PersonalInfo) => {
      try {
        if (!user) return;
        await updateUser({
          id: user.id,
          body: {
            name: data.name,
            email: data.email || undefined,
            phoneWhatsapp: data.phoneWhatsapp || undefined,
          },
        }).unwrap();
        toast.success("تم تحديث بياناتك الشخصية");
        await onSave?.(data);
        onNext?.();
      } catch (err: any) {
        toast.error(err?.data?.message || "فشل تحديث البيانات الشخصية");
      }
    },
    [user, updateUser, onSave, onNext],
  );

  // ── View mode: read-only display from auth state ────────────────────
  if (mode === "view") {
    const fields = [
      { icon: User, label: "الاسم", value: user?.name },
      { icon: Mail, label: "البريد الإلكتروني", value: user?.email, dir: "ltr" as const },
      {
        icon: Phone,
        label: "رقم التواصل",
        value: user?.phoneWhatsapp,
        dir: "ltr" as const,
      },
    ];

    const hasData = fields.some((f) => f.value);
    if (!hasData) return null;

    return (
      <SectionLayout mode="view" title="البيانات الشخصية">
        <div className="space-y-3">
          {fields.map(
            (f) =>
              f.value && (
                <ClientBriefField
                  key={f.label}
                  icon={f.icon}
                  label={f.label}
                  value={f.value}
                  dir={f.dir}
                />
              ),
          )}
          {user?.email && (
            <p className="text-xs text-portal-note-text pt-2">
              لتعديل بياناتك الشخصية، انتقل إلى{" "}
              <a href="/portal/account" className="text-secondary-500 underline">
                الحساب الشخصي
              </a>
              .
            </p>
          )}
        </div>
      </SectionLayout>
    );
  }

  // ── Wizard / Edit mode: editable form ───────────────────────────────
  return (
    <SectionLayout
      mode={mode}
      stepNumber={mode === "wizard" ? 1 : undefined}
      title="البيانات الشخصية"
      instructions={
        mode === "wizard"
          ? [
              "هذه بياناتك الشخصية التي ستُستخدم لتسجيل الدخول والتواصل معك",
              "يمكنك تعديل البريد الإلكتروني أو رقم الهاتف أو الاحتفاظ بالقيم الحالية",
            ]
          : undefined
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-portal-icon" />
                  الاسم
                  <span className="text-danger-500">*</span>
                </FormLabel>
                <FormInputControl placeholder="اسمك الكامل" {...field} />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-portal-icon" />
                  البريد الإلكتروني
                </FormLabel>
                <FormInputControl
                  placeholder="your@email.com"
                  type="email"
                  dir="ltr"
                  {...field}
                  value={field.value ?? ""}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneWhatsapp"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-portal-icon" />
                  رقم التواصل (واتساب)
                </FormLabel>
                <FormInputControl
                  placeholder="+9665XXXXXXXX"
                  type="tel"
                  dir="ltr"
                  {...field}
                  value={field.value ?? ""}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />

          {!hideNavigation && mode === "wizard" && (
            <div className="flex items-center justify-between pt-2">
              <NavigationButtons
                onBack={onBack}
                submitLabel="التالي"
              />
            </div>
          )}

          {hideNavigation && (
            <ActionButton
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ البيانات الشخصية"}
            </ActionButton>
          )}
        </form>
      </Form>
    </SectionLayout>
  );
}