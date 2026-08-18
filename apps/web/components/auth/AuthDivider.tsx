import { Separator } from "@/components/ui/separator";

interface AuthDividerProps {
  text?: string;
}

export function AuthDivider({ text = "أو" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-4 py-2">
      <Separator className="flex-1" />
      <span className="text-sm font-medium text-muted-foreground">{text}</span>
      <Separator className="flex-1" />
    </div>
  );
}
