import { Calendar } from "lucide-react";
import { StatusType, StatusBadge } from "./StatusBadge";

interface DeliverableItemProps {
  title: string;
  description: string;
  date: string;
  status: StatusType;
  statusLabel: string;
}

export function DeliverableItem({
  title,
  description,
  date,
  status,
  statusLabel,
}: DeliverableItemProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-white border-[1.5px] border-portal-card-border rounded-[16px]">
      <div className="flex-1 min-w-0 text-right">
        <h4 className="text-[20px] font-semibold leading-[30px] text-natural-100 truncate">
          {title}
        </h4>
        <p className="mt-1 text-[15px] leading-[22px] text-portal-note-text line-clamp-1">
          {description}
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-2 text-portal-date">
          <span className="text-[14px] leading-[21px]">{date}</span>
          <Calendar className="w-[13px] h-[14px] text-portal-icon" />
        </div>
      </div>

      <div className="mr-4">
        <StatusBadge status={status} label={statusLabel} />
      </div>
    </div>
  );
}
