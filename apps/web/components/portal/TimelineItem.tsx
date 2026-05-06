import { Calendar } from "lucide-react";

interface TimelineItemProps {
  date: string;
  text: string;
  icon: React.ReactNode;
}

export function TimelineItem({ date, text, icon }: TimelineItemProps) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white border-[1.5px] border-portal-card-border rounded-[16px]">
      <div className="flex-1 text-right">
        <p className="flex items-center justify-end gap-1.5 text-[18px] font-normal leading-[27px] text-portal-note-text">
          {date}
          <Calendar className="w-[13px] h-[14px] text-portal-icon" />
        </p>
        <p className="mt-1 text-[22px] font-medium leading-[33px] text-natural-100">
          {text}
        </p>
      </div>
      <div className="flex items-center justify-center shrink-0 w-[64px] h-[64px] rounded-full bg-badge-gray-bg">
        {icon}
      </div>
    </div>
  );
}
