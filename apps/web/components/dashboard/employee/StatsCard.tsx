import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  warning: "text-yellow-600",
  success: "text-green-600",
  destructive: "text-destructive",
};

export function StatsCard({
  label,
  value,
  variant = "default",
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${VARIANT_CLASSES[variant]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
