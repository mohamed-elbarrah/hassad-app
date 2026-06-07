"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Image from "next/image";

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <Image
              src="/masar.svg"
              alt="Logo"
              width={100}
              height={100}
            />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-secondary-500">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-neutral-300">
            من فضلك قم بادخال معلومات لتسجيل الدخول
          </p>
        </div>

        {/* Form */}
        <LoginForm />
      </div>
    </AuthLayout>
  );
}
