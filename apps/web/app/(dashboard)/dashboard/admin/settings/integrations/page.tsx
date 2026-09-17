"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { CloudCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import {
  AdminPageError,
  AdminPageLoading,
} from "@/components/dashboard/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetIntegrationSettingsQuery,
  useTestR2Mutation,
  useUpdateIntegrationSettingsMutation,
  type R2SettingsInput,
  type UpdateIntegrationSettingsRequest,
} from "@/features/settings/integrationsApi";
import { adminErrorMessage, adminSuccessMessage } from "@/lib/i18n";

type FormValues = {
  whatsappPhone: string;
  r2Endpoint: string;
  r2Bucket: string;
  r2PublicDomain: string;
  r2AccessKey: string;
  r2SecretKey: string;
};
const emptyForm: FormValues = {
  whatsappPhone: "",
  r2Endpoint: "",
  r2Bucket: "",
  r2PublicDomain: "",
  r2AccessKey: "",
  r2SecretKey: "",
};

export default function IntegrationsSettingsPage() {
  const query = useGetIntegrationSettingsQuery();
  const [update, updateState] = useUpdateIntegrationSettingsMutation();
  const [testR2, testState] = useTestR2Mutation();
  const [values, setValues] = useState<FormValues>(emptyForm);

  useEffect(() => {
    if (!query.data) return;
    // The query is the external source of truth; hydrate editable fields once it arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues({
      whatsappPhone: query.data.whatsappPhone ?? "",
      r2Endpoint: query.data.r2.endpoint ?? "",
      r2Bucket: query.data.r2.bucket ?? "",
      r2PublicDomain: query.data.r2.publicDomain ?? "",
      // Secret values are deliberately never returned or placed in the form.
      r2AccessKey: "",
      r2SecretKey: "",
    });
  }, [query.data]);

  if (query.isLoading)
    return (
      <div dir="rtl">
        <AdminPageLoading />
      </div>
    );
  if (query.isError) {
    return (
      <div dir="rtl" className="flex flex-col gap-6">
        <PageHeader title="Integration Settings" icon={CloudCog} />
        <AdminPageError
          title="Unable to load integration settings"
          description={adminErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const setField =
    (field: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
    };
  const getR2Input = (): R2SettingsInput => ({
    endpoint: values.r2Endpoint || undefined,
    bucket: values.r2Bucket || undefined,
    publicDomain: values.r2PublicDomain || null,
    accessKey: values.r2AccessKey || undefined,
    secretKey: values.r2SecretKey || undefined,
  });

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body: UpdateIntegrationSettingsRequest = {
      whatsappPhone: values.whatsappPhone.trim() || null,
    };
    const r2 = getR2Input();
    const r2Changed =
      r2.endpoint !== (query.data?.r2.endpoint ?? undefined) ||
      r2.bucket !== (query.data?.r2.bucket ?? undefined) ||
      r2.publicDomain !== (query.data?.r2.publicDomain ?? null) ||
      Boolean(r2.accessKey) ||
      Boolean(r2.secretKey);
    if (r2Changed) body.r2 = r2;
    try {
      const result = await update(body).unwrap();
      toast.success(adminSuccessMessage(result.code));
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      updateState.reset();
    }
  };
  const runTest = async () => {
    try {
      const result = await testR2(getR2Input()).unwrap();
      toast.success(adminSuccessMessage(result.code ?? "R2_TEST_SUCCEEDED"));
    } catch (error) {
      toast.error(adminErrorMessage(error));
    } finally {
      testState.reset();
    }
  };
  const canTestR2 =
    Boolean(query.data?.r2.hasCredentials) ||
    Boolean(
      values.r2Endpoint &&
      values.r2Bucket &&
      values.r2AccessKey &&
      values.r2SecretKey,
    );
  const busy = updateState.isLoading || testState.isLoading;

  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <PageHeader
        title="Integration Settings"
        description="Configure WhatsApp support and Cloudflare R2 storage."
        icon={CloudCog}
      />
      <form onSubmit={save} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>
              Enter the number in international format, for example
              +9665XXXXXXXX. Leave it empty to hide the support button.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="whatsappPhone">WhatsApp phone number</Label>
            <Input
              id="whatsappPhone"
              inputMode="tel"
              autoComplete="tel"
              value={values.whatsappPhone}
              onChange={setField("whatsappPhone")}
              disabled={busy}
              dir="ltr"
              placeholder="+9665XXXXXXXX"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cloudflare R2</CardTitle>
            <CardDescription>
              These values configure file storage. Existing credentials are
              never displayed. Test R2 sends a real bucket connectivity request.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="r2Endpoint">CLOUDFLARE_R2_ENDPOINT</Label>
              <Input
                id="r2Endpoint"
                type="url"
                dir="ltr"
                value={values.r2Endpoint}
                onChange={setField("r2Endpoint")}
                disabled={busy}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r2Bucket">CLOUDFLARE_R2_BUCKET</Label>
              <Input
                id="r2Bucket"
                dir="ltr"
                value={values.r2Bucket}
                onChange={setField("r2Bucket")}
                disabled={busy}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r2PublicDomain">
                CLOUDFLARE_R2_PUBLIC_DOMAIN
              </Label>
              <Input
                id="r2PublicDomain"
                type="url"
                dir="ltr"
                value={values.r2PublicDomain}
                onChange={setField("r2PublicDomain")}
                disabled={busy}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r2AccessKey">CLOUDFLARE_R2_ACCESS_KEY</Label>
              <Input
                id="r2AccessKey"
                type="password"
                dir="ltr"
                autoComplete="off"
                value={values.r2AccessKey}
                onChange={setField("r2AccessKey")}
                disabled={busy}
                placeholder={
                  query.data?.r2.hasCredentials
                    ? "Configured — leave empty to keep the current value"
                    : undefined
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="r2SecretKey">CLOUDFLARE_R2_SECRET_KEY</Label>
              <Input
                id="r2SecretKey"
                type="password"
                dir="ltr"
                autoComplete="new-password"
                value={values.r2SecretKey}
                onChange={setField("r2SecretKey")}
                disabled={busy}
                placeholder={
                  query.data?.r2.hasCredentials
                    ? "Configured — leave empty to keep the current value"
                    : undefined
                }
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Badge
                variant={
                  query.data?.r2.hasCredentials ? "secondary" : "outline"
                }
              >
                {query.data?.r2.hasCredentials
                  ? "Credentials configured"
                  : "Credentials not configured"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {updateState.isLoading ? "Saving..." : "Save settings"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void runTest()}
            disabled={busy || !canTestR2}
          >
            {testState.isLoading ? "Testing..." : "Test R2 connection"}
          </Button>
        </div>
      </form>
    </div>
  );
}
