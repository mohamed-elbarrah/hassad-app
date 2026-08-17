import { Badge } from "@/components/ui/badge";

export type StatusTone =
  | "neutral"
  | "active"
  | "attention"
  | "warning"
  | "success"
  | "destructive";

const toneVariant: Record<
  StatusTone,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  neutral: "secondary",
  active: "default",
  attention: "outline",
  warning: "outline",
  success: "default",
  destructive: "destructive",
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return <Badge variant={toneVariant[tone]}>{children}</Badge>;
}
