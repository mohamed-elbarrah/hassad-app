"use client";

import type { ReactNode } from "react";
import { SkipForward } from "lucide-react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";

interface StepLayoutProps {
  stepNumber: number;
  title: string;
  instructions: string[];
  isOptional?: boolean;
  onSkip?: () => void;
  children: ReactNode;
}

export function StepLayout({
  stepNumber,
  title,
  instructions,
  isOptional,
  onSkip,
  children,
}: StepLayoutProps) {
  return (
    <SurfaceCard className="shadow-none" contentClassName="p-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-portal-icon mb-1">
              الخطوة {stepNumber}
            </p>
            <h3 className="text-xl font-bold text-natural-100">{title}</h3>
          </div>
          {isOptional && onSkip && (
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={onSkip}
              icon={<SkipForward className="w-4 h-4" />}
              iconPosition="left"
            >
              تخطي
            </ActionButton>
          )}
        </div>

        <p className="text-sm leading-relaxed text-secondary-700 mb-6">
          {instructions.join(" ")}
        </p>

        {children}
      </div>
    </SurfaceCard>
  );
}
