"use client";

import { useAppSelector } from "@/lib/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketingWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Marketing Workspace
        </h1>
        <Badge variant="default" className="text-sm px-3 py-1 bg-orange-600 hover:bg-orange-700">
          {user.role}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name || "Marketer"}!</CardTitle>
          <CardDescription>Campaigns & Analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Registered Email</p>
              <p className="font-medium text-base">{user.email}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="text-sm text-foreground/80">
                Track marketing campaigns and measure ROI. Access the Marketing tools from the sidebar to review active promotions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
