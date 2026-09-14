"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { useAcceptInvitationMutation } from "@/features/auth/authApi";
import { authErrorMessage } from "@/lib/i18n";
import { useForm } from "react-hook-form";

const invitationSchema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(128, "كلمة المرور طويلة جداً")
      .regex(/\S/, "لا يمكن أن تكون كلمة المرور مسافات فقط"),
    confirmPassword: z.string().min(1, "يرجى تأكيد كلمة المرور"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "كلمتا المرور غير متطابقتين",
  });

type InvitationFormValues = z.infer<typeof invitationSchema>;

export function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [acceptInvitation, { isLoading }] = useAcceptInvitationMutation();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: InvitationFormValues) {
    if (!token) {
      setGlobalError("رابط الدعوة غير صالح أو منتهي الصلاحية.");
      return;
    }

    setGlobalError(null);
    try {
      await acceptInvitation({
        token,
        password: values.password,
      }).unwrap();
      // The client signs in normally after choosing the initial password.
      router.replace("/login");
    } catch (error: unknown) {
      setGlobalError(authErrorMessage(error));
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertDescription>
            رابط الدعوة غير صالح أو منتهي الصلاحية.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {globalError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      <AuthInput
        {...register("password")}
        id="invitation-password"
        label="كلمة المرور الجديدة"
        icon="lock"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        error={errors.password?.message}
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      <AuthInput
        {...register("confirmPassword")}
        id="invitation-password-confirmation"
        label="تأكيد كلمة المرور"
        icon="lock"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      <AuthButton type="submit" variant="primary" fullWidth disabled={isLoading}>
        {isLoading ? "جارٍ إعداد الحساب..." : "إعداد كلمة المرور"}
      </AuthButton>
    </form>
  );
}
