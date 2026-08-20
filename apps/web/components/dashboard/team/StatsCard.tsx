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
  default: "text-natural-100",
  warning: "text-alert-600",
  success: "text-success-600",
  destructive: "text-danger-500",
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
