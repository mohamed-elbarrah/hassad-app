"use client";

import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  SENT: "مُرسل",
  SIGNED: "موقّع",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  SENT: "default",
  SIGNED: "default",
  ACTIVE: "secondary",
  EXPIRED: "secondary",
  CANCELLED: "destructive",
};

function fmt(n: number) {
  return n.toLocaleString("ar-DZ");
}

export default function FinanceContractsPage() {
  const { data, isLoading, isError } = useGetContractsQuery({ limit: 30 });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">العقود</h1>
        <p className="text-sm text-muted-foreground mt-1">
          قيمة العقود وحالتها لكل عميل.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            قائمة العقود
            {data && (
              <span className="text-muted-foreground font-normal text-sm mr-2">
                ({data.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">حدث خطأ أثناء تحميل العقود.</p>
          )}
          {!isLoading && !isError && data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">قيمة العقد</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ البداية</TableHead>
                  <TableHead className="text-right">تاريخ النهاية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      لا توجد عقود.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((contract) => {
                  const clientName = contract.client?.companyName ?? "—";
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{clientName}</TableCell>
                      <TableCell dir="ltr">{fmt(contract.totalValue)} دج</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[contract.status] ?? "outline"}>
                          {STATUS_LABELS[contract.status] ?? contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell dir="ltr">
                        {new Date(contract.startDate).toLocaleDateString("ar-DZ")}
                      </TableCell>
                      <TableCell dir="ltr">
                        {new Date(contract.endDate).toLocaleDateString("ar-DZ")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
