"use client";

import { useAppSelector } from "@/lib/hooks";
import { UserRole } from "@hassad/shared";
import { PortalPageIntro } from "@/components/portal/PortalPageIntro";
import { PortalSurfaceCard } from "@/components/portal/PortalSurfaceCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Mail } from "lucide-react";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function PortalAccountPage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5" dir="rtl">
      <PortalPageIntro
        title="الحساب الشخصي"
        description="معلومات حسابك وبيانات التواصل المرتبطة بملفك الشخصي في المنصة."
        icon={Settings}
      />

      <PortalSurfaceCard
        title="البيانات الأساسية"
        description="تفاصيل حسابك الحالي في البوابة"
        icon={User}
      >
        <div className="flex items-center gap-4 pb-5 border-b-[1.5px] border-portal-divider">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarFallback
              className="rounded-xl text-lg font-semibold"
              style={{ backgroundColor: "#121936", color: "#fff" }}
            >
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-natural-100">
              {user.name}
            </h3>
            <span className="inline-flex h-8 items-center justify-center rounded-full bg-badge-gray-bg px-3 text-sm font-medium text-secondary-500">
              عميل
            </span>
          </div>
        </div>

        <div className="pt-5 space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-portal-icon shrink-0" />
            <div>
              <p className="text-xs text-portal-note-text mb-0.5">
                الاسم الكامل
              </p>
              <p className="font-medium text-natural-100">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-portal-icon shrink-0" />
            <div>
              <p className="text-xs text-portal-note-text mb-0.5">
                البريد الإلكتروني
              </p>
              <p className="font-medium text-natural-100">{user.email}</p>
            </div>
          </div>
        </div>
      </PortalSurfaceCard>
    </div>
  );
}
