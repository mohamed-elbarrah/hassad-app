"use client";

import type { ReactNode } from "react";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              الخطوة {stepNumber}
            </p>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
          </div>
          {isOptional && onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              data-icon="inline-start"
              className="gap-2"
            >
              <SkipForward className="h-4 w-4" />
              تخطي
            </Button>
          )}
        </div>

        <p className="mb-6 text-sm leading-relaxed text-foreground">
          {instructions.join(" ")}
        </p>

        {children}
      </CardContent>
    </Card>
  );
}
