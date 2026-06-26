/**
 * SectionLayout - Layout wrapper for profile section components
 * 
 * Renders appropriate layout based on mode:
 * - wizard: Shows step number, instructions, skip button
 * - edit: Shows title only, no navigation
 * - view: Shows title with formatted display
 */

"use client";

import type { ReactNode } from "react";
import { SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import type { ProfileMode, ViewFieldProps } from "./types";

interface SectionLayoutProps {
  /** Component mode */
  mode: ProfileMode;
  /** Step number (wizard mode only) */
  stepNumber?: number;
  /** Section title */
  title: string;
  /** Help text / instructions */
  instructions?: string[];
  /** Whether this step is optional (wizard mode) */
  isOptional?: boolean;
  /** Skip callback (wizard mode) */
  onSkip?: () => void;
  /** Children content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

export function SectionLayout({
  mode,
  stepNumber,
  title,
  instructions,
  isOptional,
  onSkip,
  children,
  className,
}: SectionLayoutProps) {
  // Wizard mode: show step number, instructions, skip button
  if (mode === "wizard") {
    return (
      <SurfaceCard className={className ?? "shadow-none"} contentClassName="p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              {stepNumber !== undefined && (
                <p className="text-sm font-medium text-portal-icon mb-1">
                  الخطوة {stepNumber}
                </p>
              )}
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

          {instructions && instructions.length > 0 && (
            <p className="text-sm leading-relaxed text-secondary-700 mb-6">
              {instructions.join(" ")}
            </p>
          )}

          {children}
        </div>
      </SurfaceCard>
    );
  }

  // Edit mode: show title only, no step number or instructions
  if (mode === "edit") {
    return (
      <SurfaceCard className={className ?? "shadow-none"} contentClassName="p-6">
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-natural-100">{title}</h3>
          {children}
        </div>
      </SurfaceCard>
    );
  }

  // View mode: show title with formatted display
  return (
    <SurfaceCard className={className ?? "shadow-none"} contentClassName="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-natural-100">{title}</h3>
        {children}
      </div>
    </SurfaceCard>
  );
}

/**
 * NavigationButtons - Reusable navigation for wizard mode
 */
interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  submitLabel?: string;
}

export function NavigationButtons({
  onBack,
  onNext,
  submitLabel = "التالي",
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-portal-divider">
      {onBack && (
        <ActionButton type="button" variant="outline" onClick={onBack}>
          السابق
        </ActionButton>
      )}
      <ActionButton type="submit" variant="primary" className="mr-auto">
        {submitLabel}
      </ActionButton>
    </div>
  );
}

/**
 * ViewField - Display a single field in view mode
 */
export function ViewField({
  label,
  value,
  icon: Icon,
  dir = "rtl",
  asList = false,
}: ViewFieldProps) {
  if (!value) {
    return null;
  }

  const displayValue = Array.isArray(value) ? value.join("، ") : value;

  return (
    <div className={cn("flex items-start gap-3", dir === "rtl" ? "flex-row-reverse" : "")}>
      {Icon && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-secondary-500" />
        </div>
      )}
      <div className={cn("min-w-0", dir === "rtl" ? "text-right" : "text-left")}>
        <p className="text-xs font-medium text-portal-icon">{label}</p>
        {asList && Array.isArray(value) ? (
          <ul className="text-sm text-natural-100 mt-1">
            {value.map((item, index) => (
              <li key={index} className="list-disc list-inside">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-natural-100 mt-1" dir={dir}>
            {displayValue}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ViewFieldGroup - Container for multiple view fields
 */
interface ViewFieldGroupProps {
  children: ReactNode;
  className?: string;
}

export function ViewFieldGroup({ children, className }: ViewFieldGroupProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}