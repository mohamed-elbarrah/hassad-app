"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  FileText,
  PenTool,
  User,
} from "lucide-react";
import Link from "next/link";

import type { PortalRequestSummary } from "@/features/portal/portalApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { portalRequestStageLabel, portalServiceName } from "@/lib/i18n";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getRequestAction,
  getRequestActionLabel,
  getRequestStatusLabel,
  resolveStatusGroup,
} from "@/lib/utils/requestStatus";

interface RequestRowProps {
  request: PortalRequestSummary;
}

function RequestStatusBadge({ status }: { status: string }) {
  const group = resolveStatusGroup(status);
  const variant =
    group === "cancelled"
      ? "destructive"
      : group === "signed"
        ? "default"
        : "secondary";

  return <Badge variant={variant}>{getRequestStatusLabel(status)}</Badge>;
}

export function RequestRow({ request }: RequestRowProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const action = getRequestAction(request);
  const services = request.services
    .map((service) => portalServiceName(service.names))
    .join("، ");
  const servicesPreview = request.services
    .slice(0, 2)
    .map((service) => portalServiceName(service.names))
    .join("، ");
  const servicesMore =
    request.services.length > 2 ? ` +${request.services.length - 2}` : "";

  return (
    <>
      <TableRow>
        <TableCell>
          <RequestActionCell action={action} />
        </TableCell>
        <TableCell>
          <RequestStatusBadge status={request.status} />
        </TableCell>
        <TableCell className="text-muted-foreground">
          <span title={services}>{servicesPreview}</span>
          {servicesMore ? (
            <span className="text-xs">{servicesMore}</span>
          ) : null}
        </TableCell>
        <TableCell>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium" title={request.companyName}>
              {request.companyName}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="size-3 shrink-0" />
              <span className="truncate" title={request.contactName}>
                {request.contactName}
              </span>
            </span>
          </div>
        </TableCell>
        <TableCell>
          <time
            className="flex items-center gap-1.5 text-muted-foreground"
            dateTime={request.createdAt}
          >
            <Calendar className="size-3.5 shrink-0" />
            {formatDate(request.createdAt, "ar-SA-u-nu-latn")}
          </time>
        </TableCell>
        <TableCell>
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`عرض تفاصيل الطلب ${request.companyName}، رقم ${request.id}`}
              >
                <Eye />
              </Button>
            </DialogTrigger>
            <DialogContent
              dir="rtl"
              className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
              closeLabel="إغلاق"
            >
              <DialogHeader className="text-right sm:text-right">
                <DialogTitle>{request.companyName}</DialogTitle>
                <DialogDescription>
                  تفاصيل الطلب ومتابعة حالته الحالية.
                </DialogDescription>
              </DialogHeader>
              <RequestDetail request={request} />
            </DialogContent>
          </Dialog>
        </TableCell>
      </TableRow>
    </>
  );
}

function RequestActionCell({
  action,
}: {
  action: ReturnType<typeof getRequestAction>;
}) {
  switch (action.kind) {
    case "sign-contract":
      return (
        <Button asChild size="sm">
          <Link href={action.href}>
            <PenTool />
            {getRequestActionLabel(action)}
          </Link>
        </Button>
      );
    case "review-proposal":
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={action.href}>
            <FileText />
            {getRequestActionLabel(action)}
          </Link>
        </Button>
      );
    case "in-progress":
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {getRequestActionLabel(action)}
        </span>
      );
    case "completed":
    case "unavailable":
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4" />
          {getRequestActionLabel(action)}
        </span>
      );
  }
}

function RequestDetail({ request }: { request: PortalRequestSummary }) {
  const description = request.description;

  return (
    <Card className="bg-muted/30">
      <CardContent className="flex flex-col gap-5 pt-6">
        <div>
          <p className="text-sm font-medium">
            {request.status === "SIGNED"
              ? "تم توقيع العقد وتحويل الطلب إلى مشروع."
              : "حالة الطلب"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {portalRequestStageLabel(request.stage)}
          </p>
          {description ? (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <p className="text-sm font-medium">ملاحظاتك</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
        <Separator />
        <div className="grid gap-5 md:grid-cols-2">
          {request.services.length ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">
                الخدمات المطلوبة ({request.services.length})
              </p>
              <ul className="flex flex-col gap-2">
                {request.services.map((service) => (
                  <li
                    key={service.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {portalServiceName(service.names)}
                      </span>
                    </span>
                    {service.quantity > 1 ? (
                      <span className="shrink-0 text-muted-foreground">
                        ×{service.quantity}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">المستندات</p>
            <div className="flex flex-wrap gap-2">
              {request.latestProposal?.url ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={request.latestProposal.url}>
                    <FileText />
                    عرض فني
                    <ExternalLink />
                  </Link>
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  لا يوجد عرض فني بعد
                </span>
              )}
              {request.latestContract?.url ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={request.latestContract.url}>
                    <PenTool />
                    {request.latestContract.status === "SENT"
                      ? "توقيع العقد"
                      : "العقد"}
                    <ExternalLink />
                  </Link>
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  لا يوجد عقد بعد
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
