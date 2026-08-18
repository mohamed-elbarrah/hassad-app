"use client";

import { useState } from "react";
import { CheckCircle2, CircleX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { Link } from "@/components/auth/AuthLink";
import { useResetPasswordMutation } from "@/features/auth/authApi";
import { authErrorMessage, authSuccessMessage } from "@/lib/i18n";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      toast.error("رابط غير صالح أو منتهي الصلاحية");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      const result = await resetPassword({ token, password }).unwrap();
      setSubmitted(true);
      toast.success(authSuccessMessage(result.code));
    } catch (err: unknown) {
      toast.error(authErrorMessage(err));
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-6 py-8 text-center">
        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 aria-hidden="true" className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-primary">تم التعيين بنجاح</h2>
          <p className="text-sm text-muted-foreground">
            تم إعادة تعيين كلمة المرور. يمكنك الآن تسجيل الدخول.
          </p>
        </div>
        <Link href="/login" className="w-full">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-6 py-8 text-center">
        <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <CircleX aria-hidden="true" className="size-8 text-destructive" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-destructive">رابط غير صالح</h2>
          <p className="text-sm text-muted-foreground">
            الرابط منتهي الصلاحية أو غير صالح. يرجى طلب رابط جديد.
          </p>
        </div>
        <Link href="/forgot-password">طلب رابط جديد</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AuthInput
        id="reset-password"
        label="كلمة المرور الجديدة"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <AuthInput
        id="reset-password-confirmation"
        label="تأكيد كلمة المرور"
        type="password"
        showPasswordToggle
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <AuthButton
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading || !password || !confirmPassword}
      >
        {isLoading ? "جارٍ التعيين..." : "إعادة تعيين كلمة المرور"}
      </AuthButton>
    </form>
  );
}
