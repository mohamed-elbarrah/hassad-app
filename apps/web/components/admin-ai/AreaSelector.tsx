"use client";

import { AiAssistantArea } from "@hassad/shared";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const AREA_LABELS: Record<AiAssistantArea, string> = {
  [AiAssistantArea.CRM]: "CRM",
  [AiAssistantArea.FINANCE]: "المالية",
  [AiAssistantArea.CLIENTS]: "العملاء",
  [AiAssistantArea.PM]: "إدارة المشاريع",
  [AiAssistantArea.MARKETING]: "التسويق",
  [AiAssistantArea.ALL]: "الكل",
};

interface AreaSelectorProps {
  selected: AiAssistantArea[];
  onChange: (areas: AiAssistantArea[]) => void;
}

export function AreaSelector({ selected, onChange }: AreaSelectorProps) {
  const allAreas = Object.values(AiAssistantArea);
  const isAll = selected.includes(AiAssistantArea.ALL);

  const toggle = (area: AiAssistantArea) => {
    if (area === AiAssistantArea.ALL) {
      onChange([AiAssistantArea.ALL]);
      return;
    }
    const withoutAll = selected.filter((a) => a !== AiAssistantArea.ALL);
    const next = withoutAll.includes(area)
      ? withoutAll.filter((a) => a !== area)
      : [...withoutAll, area];
    onChange(next.length === 0 ? [AiAssistantArea.ALL] : next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allAreas.map((area) => {
        const active = isAll ? area === AiAssistantArea.ALL : selected.includes(area);
        return (
          <Button
            key={area}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            onClick={() => toggle(area)}
            aria-pressed={active}
            className="rounded-full"
          >
            {active && <Check />}
            {AREA_LABELS[area]}
          </Button>
        );
      })}
    </div>
  );
}
