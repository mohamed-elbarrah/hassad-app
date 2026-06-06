import { UserAvatar } from "./UserAvatar";
import { PortalActionButton } from "./PortalActionButton";

interface PmCardProps {
  name: string;
  role: string;
  status: "online" | "offline";
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
        <UserAvatar
          name={name}
          size="xl"
          className="shrink-0"
        />
      </div>

      <PortalActionButton
        variant="pm"
        size="xl"
        fullWidth
        className="text-[16px] font-semibold"
      >
        تواصل معه
      </PortalActionButton>
    </div>
  );
}
