import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  return (
    <AuthLayout showCarousel={false}>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <svg width="80" height="40" viewBox="0 0 120 50" fill="none">
              <text
                x="10"
                y="35"
                fontFamily="Arial"
                fontSize="28"
                fontWeight="bold"
                fill="#E7BE52"
              >
                مسار
              </text>
            </svg>
            <span className="text-xs font-medium tracking-widest text-secondary-500 uppercase">
              MSAR
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-secondary-500">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-sm text-neutral-300">
            أدخل كلمة المرور الجديدة أدناه
          </p>
        </div>

        {/* Form */}
        <Suspense
          fallback={
            <div className="text-center text-neutral-300">جارٍ التحميل...</div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
