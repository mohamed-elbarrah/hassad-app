"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      className={cn(
        "flex max-w-md flex-col items-center justify-center gap-8 text-center",
        className,
      )}
    >
      <div className="flex min-h-[140px] flex-col gap-4 px-4">
        <h2 className="text-2xl font-bold leading-tight text-foreground">
          {slides[current].title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {slides[current].description}
        </p>
      </div>

      <div className="flex items-center gap-3" aria-label="شرائح تسجيل الدخول">
        {slides.map((slide, idx) => (
          <Button
            key={slide.title}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrent(idx)}
            aria-label={`الشريحة ${idx + 1}`}
            aria-pressed={idx === current}
            className={cn(
              "h-3 rounded-full p-0 hover:bg-muted-foreground/50",
              idx === current
                ? "w-8 bg-primary hover:bg-primary/90"
                : "w-3 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
