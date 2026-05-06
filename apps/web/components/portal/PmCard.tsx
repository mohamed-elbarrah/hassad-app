import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PmCardProps {
  name: string;
  role: string;
  status: "online" | "offline";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function PmCard({ name, role, status }: PmCardProps) {
  return (
    <div className="p-5 bg-white space-y-5 border-[1.5px] border-portal-card-border rounded-[16px]">
      <div className="flex items-center gap-4">
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <h4 className="text-[24px] font-medium leading-[36px] text-natural-100">
              {name}
            </h4>
            {status === "online" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-badge-green-bg rounded-xl text-[14px] font-medium leading-[21px] text-badge-green-text">
                متاح الآن
                <span className="w-2 h-2 rounded-full bg-badge-green-text" />
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[18px] font-normal leading-[27px] text-portal-note-text">
            {role}
          </p>
        </div>
        <Avatar className="w-[82px] h-[82px] rounded-full shrink-0">
          <AvatarFallback className="rounded-full text-lg font-bold bg-secondary-500 text-white">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </div>

      <Button
        className="w-full h-[62px] bg-pm-button-bg hover:bg-pm-button-bg/80 rounded-[16px] text-[16px] font-semibold text-pm-button-text"
      >
        تواصل معه
      </Button>
    </div>
  );
}
