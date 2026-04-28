"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { useGetMyProposalsQuery } from "@/features/proposals/proposalsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "بانتظار ردك",
  APPROVED: "تمت الموافقة",
  REVISION_REQUESTED: "طلب تعديل",
  REJECTED: "مرفوض",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "default",
  APPROVED: "secondary",
  REVISION_REQUESTED: "destructive",
  REJECTED: "destructive",
};

export default function PortalProposalsPage() {
  const { data: proposals, isLoading, isError } = useGetMyProposalsQuery();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">العروض الفنية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          استعرض العروض الفنية المقدّمة لك وراجع تفاصيلها.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة العروض الفنية</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              حدث خطأ أثناء تحميل العروض. يرجى المحاولة لاحقاً.
            </p>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">عنوان العرض</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right">تاريخ الإرسال</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الملف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!proposals || proposals.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-10"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 opacity-30" />
                        <span>لا توجد عروض فنية حتى الآن.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {proposals?.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell className="font-medium">
                      {proposal.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {proposal.lead?.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {proposal.sentAt
                        ? new Date(proposal.sentAt as string).toLocaleDateString(
                            "ar-DZ",
                          )
                        : new Date(
                            proposal.createdAt as string,
                          ).toLocaleDateString("ar-DZ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANT[proposal.status] ?? "outline"
                        }
                      >
                        {STATUS_LABELS[proposal.status] ?? proposal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {proposal.shareLinkToken ? (
                        <Link
                          href={`/portal/proposals/${proposal.shareLinkToken}`}
                        >
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            فتح العرض
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          غير متاح
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
