"use client";

import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateClientStageMutation } from "@/features/clients/clientsApi";
import { PipelineStage, PIPELINE_STAGE_ORDER } from "@hassad/shared";

const STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.NEW_LEAD]: "عميل جديد",
  [PipelineStage.CONTACTED]: "تم التواصل",
  [PipelineStage.MEETING_SCHEDULED]: "اجتماع محدد",
  [PipelineStage.REQUIREMENTS_GATHERING]: "جمع المتطلبات",
  [PipelineStage.PROPOSAL_SENT]: "تم إرسال العرض",
  [PipelineStage.NEGOTIATION]: "التفاوض",
  [PipelineStage.WAITING_FOR_SIGNATURE]: "بانتظار التوقيع",
  [PipelineStage.CONTRACTED_WON]: "تم التعاقد",
  [PipelineStage.HANDOVER]: "تسليم للعمليات",
};

interface StageSelectProps {
  clientId: string;
  currentStage: PipelineStage;
}

export function StageSelect({ clientId, currentStage }: StageSelectProps) {
  const [updateStage, { isLoading }] = useUpdateClientStageMutation();

  async function handleChange(value: string) {
    const stage = value as PipelineStage;
    if (stage === currentStage) return;
    try {
      await updateStage({ id: clientId, body: { stage } }).unwrap();
      toast.success(`المرحلة محدّثة إلى: ${STAGE_LABELS[stage]}`);
    } catch {
      toast.error("فشل تحديث المرحلة. حاول مجدداً.");
    }
  }

  return (
    <Select
      value={currentStage}
      onValueChange={handleChange}
      disabled={isLoading}
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
