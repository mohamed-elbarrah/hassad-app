"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { UserRole } from "@hassad/shared";
import { IntakeFormV2 } from "@/components/portal/IntakeFormV2";
import { updateUser } from "@/features/auth/authSlice";
import Image from "next/image";
import {
  Building2,
  Sparkles,
  MessageCircle,
  Target,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ProfileSetupPage() {
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);
  const [formRevealed, setFormRevealed] = useState(false);

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

  const spring = { type: "spring" as const, damping: 18, stiffness: 220 };

  const welcomeVisible = { opacity: 1, scale: 1, y: 0, rotate: 0 };
  const welcomeHidden = { opacity: 0, scale: 0.85, y: -100, rotate: -1 };
  const formVisible = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
  const formHidden = { opacity: 0, y: 40, scale: 0.95, filter: "blur(6px)" };

  const handleStart = () => {
    setFormRevealed(true);
    setShowWelcome(false);
  };

  const welcomeContent = (
    <>
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full flex flex-col ">
        <div className="mb-8 lg:mb-10">
          <Image
            src="/masar.svg"
            alt="حصاد"
            width={120}
            height={120}
            className="brightness-0 invert opacity-90"
          />
        </div>

        <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4   lg:text-right">
          مرحباً بك في حصاد!
        </h1>

        <p className="text-lg xl:text-xl text-white/80 leading-relaxed mb-8 lg:mb-10   lg:text-right">
          سجل أعمالك الآن لنساعدك بشكل أفضل. خطوة بسيطة تمكن فريقنا من فهم نشاطك
          التجاري وتقديم حلول تسويقية مخصصة لك.
        </p>

        <div className="space-y-5 w-full">
          <h2 className="text-base font-semibold text-white/90 mb-4 flex items-center gap-2  lg:justify-start">
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
                <p className="font-medium text-sm">
                  نضمن توجيهك للفريق المناسب
                </p>
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

        <motion.button
          onClick={handleStart}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          className="w-auto mt-8 lg:hidden items-center gap-2 bg-white text-secondary-700 font-semibold rounded-xl px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-200 active:scale-95"
        >
          بسم الله، نبدأ!!
          {/* <ArrowLeft className="w-5 h-5" /> */}
        </motion.button>
      </div>
    </>
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row bg-portal-bg"
      dir="rtl"
    >
      {/* Mobile / Tablet */}
      <div className="lg:hidden relative min-h-screen">
        {/* Form layer — mounted once, stays in DOM, state preserved */}
        {formRevealed && (
          <div className="min-h-screen p-6">
            <AnimatePresence>
              {!showWelcome && (
                <motion.button
                  key="back-btn"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={spring}
                  onClick={() => setShowWelcome(true)}
                  className="inline-flex items-center gap-2 text-secondary-500 hover:text-secondary-600 font-medium transition-colors mb-4"
                >
                  <ArrowLeft className="w-5 h-5" />
                  العودة
                </motion.button>
              )}
            </AnimatePresence>

            <motion.div
              initial={formHidden}
              animate={showWelcome ? formHidden : formVisible}
              transition={spring}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-natural-100">
                  الملف التعريفي
                </h2>
                <p className="text-neutral-400 mt-1">
                  املأ البيانات التالية لمساعدتنا في فهم نشاطك التجاري بشكل أفضل
                </p>
              </div>

              <IntakeFormV2
                onSuccess={() => {
                  dispatch(updateUser({ intakeCompleted: true }));
                  router.push("/portal");
                }}
              />
            </motion.div>
          </div>
        )}

        {/* Welcome overlay — fixed to viewport, always in DOM */}
        <motion.div
          initial={false}
          animate={showWelcome ? welcomeVisible : welcomeHidden}
          transition={spring}
          className="fixed inset-0 z-50 bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 text-white p-8 flex flex-col justify-center overflow-hidden"
          style={{ pointerEvents: showWelcome ? "auto" : "none" }}
        >
          {welcomeContent}
        </motion.div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex lg:w-[42%] lg:sticky lg:top-0 lg:h-screen lg:self-start bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 text-white p-8 lg:p-12 xl:p-16 flex-col justify-center relative overflow-hidden">
        {welcomeContent}
      </div>

      <div className="hidden lg:flex lg:w-[58%] items-center justify-center p-6 lg:p-12 xl:p-16">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-natural-100">
              الملف التعريفي
            </h2>
            <p className="text-neutral-400 mt-1">
              املأ البيانات التالية لمساعدتنا في فهم نشاطك التجاري بشكل أفضل
            </p>
          </div>

          <IntakeFormV2
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
