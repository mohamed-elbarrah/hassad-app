"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { UserRole } from "@hassad/shared";
import { IntakeForm } from "@/components/portal/IntakeForm";
import { updateUser } from "@/features/auth/authSlice";
import Image from "next/image";
import { Building2, Sparkles, MessageCircle, Target, Clock } from "lucide-react";

export default function ProfileSetupPage() {
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== UserRole.CLIENT) {
      router.replace("/dashboard");
      return;
    }
    if (user?.intakeCompleted) {
      router.replace("/portal");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (!isInitialized || !user || user.intakeCompleted) {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      dir="rtl"
      style={{ background: "#F9FAFB" }}
    >
      <div className="lg:w-[42%] bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-md mx-auto">
          <div className="mb-10">
            <Image
              src="/masar.svg"
              alt="حصاد"
              width={120}
              height={120}
              className="brightness-0 invert opacity-90"
            />
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            مرحباً بك في حصاد!
          </h1>

          <p className="text-lg xl:text-xl text-white/80 leading-relaxed mb-10">
            سجل أعمالك الآن لنساعدك بشكل أفضل. خطوة بسيطة تمكن فريقنا من فهم
            نشاطك التجاري وتقديم حلول تسويقية مخصصة لك.
          </p>

          <div className="space-y-5">
            <h2 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              لماذا هذه الخطوة مهمة؟
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-medium text-sm">نفهم نشاطك التجاري بعمق</p>
                  <p className="text-sm text-white/60 mt-0.5">
                    نساعدك في الحصول على حلول تسويقية مصممة خصيصاً لنشاطك
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-medium text-sm">نضمن توجيهك للفريق المناسب</p>
                  <p className="text-sm text-white/60 mt-0.5">
                    نخصص لك مدير حساب يفهم احتياجاتك ومجالك
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-medium text-sm">نوفر وقتك في المستقبل</p>
                  <p className="text-sm text-white/60 mt-0.5">
                    بياناتك مسجلة مسبقاً، لا حاجة لتكرار المعلومات في كل طلب
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-medium text-sm">تواصل مباشر مع فريقك</p>
                  <p className="text-sm text-white/60 mt-0.5">
                    بعد التسجيل، يمكنك التواصل مع مدير حسابك عبر المحادثة
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-[58%] flex items-center justify-center p-6 lg:p-12 xl:p-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-natural-100">
              الملف التعريفي
            </h2>
            <p className="text-neutral-400 mt-1">
              املأ البيانات التالية لمساعدتنا في فهم نشاطك التجاري بشكل أفضل
            </p>
          </div>

          <IntakeForm
            onSuccess={() => {
              dispatch(updateUser({ intakeCompleted: true }));
              router.push("/portal");
            }}
          />
        </div>
      </div>
    </div>
  );
}
