import Link from "next/link";
import { CloudCog } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Settings() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage system settings and integrations."
      />
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Configure WhatsApp support and Cloudflare R2 storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/settings/integrations">
              <CloudCog data-icon="inline-start" />
              Integration settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
