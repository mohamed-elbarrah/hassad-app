"use client";

import React from "react";

interface AuthCarouselProps {
  className?: string;
}

const slides = [
  {
    title: "تابع تقدم مشاريعك",
    description:
      "تابع تقدم مشاريعك في الوقت الحقيقي من مكان واحد، وابقَ على اطلاع بكل مرحلة وتفاصيل التنفيذ لضمان سير العمل بسلاسة ووضوح.",
  },
  {
    title: "إدارة الحملات بكفاءة",
    description:
      "خطط، نفذ، وراقب حملاتك التسويقية بكل سهولة. احصل على تحليلات دقيقة ونتائج مؤثرة تساعدك في اتخاذ القرارات الصحيحة.",
  },
  {
    title: "تقارير شاملة ومفصلة",
    description:
      "احصل على تقارير دقيقة وشاملة تغطي جميع جوانب عملك. حلل الأداء، تعرف على النقاط القوة وفرص التحسين بكل وضوح.",
  },
];

export function AuthCarousel({ className }: AuthCarouselProps) {
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center max-w-md text-center space-y-8 ${className || ""}`}
    >
      {/* Product Screenshot Mock */}
      <div className="relative w-full aspect-[3/4] max-w-[320px] bg-white rounded-2xl shadow-lg border border-neutral-200/50 overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-6 w-full">
          {/* Dashboard Widget Mock */}
          <div className="w-full bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-secondary-500">
                تقدم المشروع
              </span>
              <svg
                className="w-5 h-5 text-neutral-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            {/* Gauge */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-32 h-16 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-[8px] border-neutral-100 border-b-neutral-200 rotate-[-45deg]">
                  <div className="absolute inset-0 rounded-full border-[8px] border-transparent border-b-secondary-500 border-l-secondary-500 rotate-[90deg]"></div>
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary-500 mt-[-10px]">
                70
              </div>
              <div className="text-xs text-neutral-300">من 100</div>
            </div>

            {/* Status Row */}
            <div className="flex items-center justify-between mt-3 w-full">
              <span className="text-xs bg-success-100 text-success-600 px-2 py-1 rounded-full font-medium">
                مكتمل
              </span>
              <span className="text-xs text-neutral-300">الرؤية البصرية</span>
            </div>
          </div>

          {/* Task Card Mock */}
          <div className="w-full bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-alert-400"></span>
                <span className="text-xs text-neutral-300">جاري</span>
              </div>
              <span className="text-sm font-medium text-secondary-500">
                صفحة الهبوط
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div className="bg-alert-400 h-2 rounded-full w-[60%]"></div>
            </div>
          </div>

          {/* Another Task */}
          <div className="w-full bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-neutral-200"></span>
              <span className="text-xs text-neutral-300">لم يبدأ</span>
            </div>
            <p className="text-sm font-medium text-secondary-500 text-right">
              الحملة الاعلانية
            </p>
            <p className="text-xs text-neutral-300 text-right mt-1">
              المرحلة الحالية: تنفيذ الحملة الإعلانية على الانستغرام و تيكتوك
            </p>
          </div>
        </div>
      </div>

      {/* Slide Text */}
      <div className="space-y-4 min-h-[140px] px-4">
        <h2 className="text-2xl font-bold text-secondary-500 leading-tight">
          {slides[current].title}
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          {slides[current].description}
        </p>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === current
                ? "w-8 h-3 bg-secondary-500"
                : "w-3 h-3 bg-neutral-200 hover:bg-neutral-300"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
