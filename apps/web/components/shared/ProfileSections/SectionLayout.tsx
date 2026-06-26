/**
 * SectionLayout - Layout wrapper for profile section components
 *
 * Renders appropriate layout based on mode:
 * - wizard: Shows step number, instructions, skip button
 * - edit: Shows title only, no navigation
 * - view: Read-only display using the shared BriefCard system
 *
 * RTL is handled by the root layout. No dir attributes are added here.
 */

"use client";

import type { ReactNode } from "react";
import { SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/design-system/ActionButton";
import { BriefCard } from "@/components/client-brief/BriefCard";
import { ClientBriefField } from "@/components/client-brief/ClientBriefField";
import type { LucideIcon } from "lucide-react";
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
      <BriefCard className={className} contentClassName="p-6">
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
      </BriefCard>
    );
  }

  // Edit mode: show title only, no step number or instructions
  if (mode === "edit") {
    return (
      <BriefCard className={className} contentClassName="p-6">
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-natural-100">{title}</h3>
          {children}
        </div>
      </BriefCard>
    );
  }

  // View mode: show title with formatted display using shared BriefCard
  return (
    <BriefCard className={className} contentClassName="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-natural-100">{title}</h3>
        {children}
      </div>
    </BriefCard>
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
 *
 * Thin wrapper around ClientBriefField to keep existing section code working
 * while centralizing the actual presentation.
 */
export function ViewField({
  label,
  value,
  icon: Icon,
  dir = "rtl",
}: ViewFieldProps) {
  if (!value) {
    return null;
  }

  return (
    <ClientBriefField
      icon={(Icon ?? ViewFieldFallbackIcon) as LucideIcon}
      label={label}
      value={Array.isArray(value) ? value.join("، ") : value}
      dir={dir}
    />
  );
}

const ViewFieldFallbackIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};

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

/**
 * SectionSubtitle - Sub-section title inside a profile card
 */
interface SectionSubtitleProps {
  icon?: LucideIcon;
  children: ReactNode;
}

export function SectionSubtitle({
  icon: Icon,
  children,
}: SectionSubtitleProps) {
  return (
    <h4 className="text-sm font-semibold text-natural-100 flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-portal-icon" aria-hidden="true" />}
      {children}
    </h4>
  );
}
