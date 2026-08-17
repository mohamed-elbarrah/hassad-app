"use client";

import { AiAssistantArea } from "@hassad/shared";
import { Check } from "lucide-react";

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
          <button
            key={area}
            type="button"
            onClick={() => toggle(area)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              active
                ? "bg-secondary-500 text-white shadow-sm"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {active && <Check className="w-3.5 h-3.5" />}
            {AREA_LABELS[area]}
          </button>
        );
      })}
    </div>
  );
}
