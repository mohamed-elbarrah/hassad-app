"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineStage, PIPELINE_STAGE_ORDER } from "@hassad/shared";

const STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NEW]: "عميل جديد",
  [PipelineStage.INTRO_SENT]: "تم التواصل",
  [PipelineStage.CALL_ATTEMPT]: "محاولة اتصال",
  [PipelineStage.MEETING_SCHEDULED]: "موعد محدد",
  [PipelineStage.MEETING_DONE]: "تم الاجتماع",
  [PipelineStage.PROPOSAL_SENT]: "تم إرسال العرض",
  [PipelineStage.FOLLOW_UP]: "متابعة",
  [PipelineStage.APPROVED]: "موافقة",
  [PipelineStage.CONTRACT_SIGNED]: "توقيع عقد",
};

interface StageSelectProps {
  currentStage: PipelineStage;
  onStageChange?: (stage: PipelineStage) => void;
  disabled?: boolean;
}

export function StageSelect({
  currentStage,
  onStageChange,
  disabled,
}: StageSelectProps) {
  function handleChange(value: string) {
    const stage = value as PipelineStage;
    if (stage !== currentStage && onStageChange) {
      onStageChange(stage);
    }
  }

  return (
    <Select
      value={currentStage}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-52 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PIPELINE_STAGE_ORDER.map((stage) => (
          <SelectItem key={stage} value={stage} className="text-xs">
            {STAGE_LABELS[stage]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
