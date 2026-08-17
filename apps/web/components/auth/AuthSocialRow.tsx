"use client";

import { SiSnapchat } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
import { AuthButton } from "./AuthButton";

function getGoogleOAuthUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";
  // Ensure no trailing slash on base
  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/auth/google`;
}

export function AuthSocialRow() {
  return (
    <div className="flex items-center gap-3 justify-center">
      {/* Google */}
      <AuthButton
        variant="social"
        aria-label="تسجيل الدخول بواسطة Google"
        onClick={() => {
          window.location.href = getGoogleOAuthUrl();
        }}
      >
        <FcGoogle className="w-5 h-5" />
      </AuthButton>

      {/* Snapchat — placeholder, shows tooltip */}
      <AuthButton
        variant="social"
        aria-label="Snapchat - قريباً"
        disabled
        className="opacity-50 cursor-not-allowed"
        title="قريباً"
      >
        <SiSnapchat className="w-5 h-5" />
      </AuthButton>
    </div>
  );
}
