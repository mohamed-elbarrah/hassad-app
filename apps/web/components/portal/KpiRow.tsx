import { ReactNode } from "react";

interface KpiRowProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function KpiRow({ label, value, icon }: KpiRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 bg-white border-[1.5px] border-portal-card-border rounded-[16px]">
      <div className="text-right">
        <p className="text-[18px] font-normal leading-[27px] text-portal-note-text">
          {label}
        </p>
        <p className="mt-0.5 text-[24px] font-medium leading-[36px] text-natural-100">
          {value}
        </p>
      </div>
      <div className="flex items-center justify-center shrink-0 w-[64px] h-[64px] rounded-full bg-badge-gray-bg">
        {icon}
      </div>
    </div>
  );
}
