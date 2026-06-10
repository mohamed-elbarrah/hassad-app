import { SignupForm } from "@/components/auth/SignupForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Image from "next/image";

export default function SignupPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <Image src="/masar.svg" alt="Logo" width={100} height={100} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-secondary-500">
            إنشاء حساب جديد
          </h1>
          <p className="text-sm text-neutral-300">
            انضم إلى منصة حصاد وابدأ رحلة نمو نشاطك التجاري
          </p>
        </div>

        {/* Form */}
        <SignupForm />
      </div>
    </AuthLayout>
  );
}
