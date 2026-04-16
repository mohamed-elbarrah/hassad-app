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

export default function SalesWorkspacePage() {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Sales Workspace
        </h1>
        <Badge variant="default" className="text-sm px-3 py-1 bg-emerald-600 hover:bg-emerald-700">
          {user.role}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.name || "Sales Executive"}!</CardTitle>
          <CardDescription>CRM & Client Management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Registered Email</p>
              <p className="font-medium text-base">{user.email}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Your Metrics</p>
              <p className="text-sm text-foreground/80">
                View pipelines, handle client relationships, and track upcoming deadlines through the CRM navigator on the right sidebar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
