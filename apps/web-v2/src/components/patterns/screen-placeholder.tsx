import { Card, CardContent } from "@/components/ui/card";

type ScreenPlaceholderProps = {
  label: string;
};

export function ScreenPlaceholder({ label }: ScreenPlaceholderProps) {
  return (
    <div className="flex min-h-[calc(100svh-14rem)] items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardContent className="flex items-center justify-center px-6 py-16">
          <h1 className="text-center text-2xl font-semibold tracking-tight">{label}</h1>
        </CardContent>
      </Card>
    </div>
  );
}
