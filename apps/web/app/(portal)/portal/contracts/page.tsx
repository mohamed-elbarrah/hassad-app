"use client";

import Link from "next/link";
import { FileSignature, ExternalLink } from "lucide-react";
import { useGetPortalContractsQuery } from "@/features/portal/portalApi";
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
  SENT: "بانتظار توقيعك",
  SIGNED: "موقّع",
  ACTIVE: "ساري",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SENT: "default",
  SIGNED: "secondary",
  ACTIVE: "secondary",
  EXPIRED: "outline",
  CANCELLED: "destructive",
};

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_RETAINER: "شهري ثابت",
  FIXED_PROJECT: "مشروع محدد",
  ONE_TIME_SERVICE: "خدمة مرة واحدة",
};

function fmt(n: number) {
  return n.toLocaleString("ar-SA");
}

export default function PortalContractsPage() {
  const { data: contractsData, isLoading, isError } = useGetPortalContractsQuery({
    page: 1,
    limit: 20,
  });

  const contracts = contractsData?.data ?? [];

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">العقود</h1>
        <p className="text-sm text-muted-foreground mt-1">
          استعرض عقودك وراجع تفاصيلها أو وقّعها إلكترونياً.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة العقود</CardTitle>
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
              حدث خطأ أثناء تحميل العقود. يرجى المحاولة لاحقاً.
            </p>
          )}
          {!isLoading && !isError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">عنوان العقد</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                  <TableHead className="text-right">القيمة الكلية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">العقد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-10"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FileSignature className="h-8 w-8 opacity-30" />
                        <span>لا توجد عقود حتى الآن.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {contracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      {contract.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {TYPE_LABELS[contract.type] ?? contract.type}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(contract.startDate).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(contract.endDate).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fmt(contract.totalValue)} ر.س
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[contract.status] ?? "outline"}
                      >
                        {STATUS_LABELS[contract.status] ?? contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.shareLinkToken ? (
                        <Link
                          href={`/portal/contracts/${contract.shareLinkToken}`}
                        >
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            {contract.status === "SENT"
                              ? "توقيع العقد"
                              : "فتح العقد"}
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
