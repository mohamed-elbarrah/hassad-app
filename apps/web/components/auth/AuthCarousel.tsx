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
      {/* Slide Image or mockup */}

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
