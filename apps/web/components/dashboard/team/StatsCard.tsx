import { Card } from "@/components/ui/card";

interface StatsCardProps {
  label: string;
  value: number;
  variant?: "default" | "warning" | "success" | "destructive";
}

const VARIANT_CLASSES: Record<
  NonNullable<StatsCardProps["variant"]>,
  string
> = {
  default: "text-foreground",
  warning: "text-warning",
  success: "text-success",
  destructive: "text-destructive",
};

export function StatsCard({
  label,
  value,
  variant = "default",
}: StatsCardProps) {
  return (
    <Card title={label}>
      <p className={`text-3xl font-bold ${VARIANT_CLASSES[variant]}`}>
        {value}
      </p>
    </Card>
  );
}
