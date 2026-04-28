"use client";

import {
  useGetPaymentTicketsQuery,
  useResolvePaymentTicketMutation,
} from "@/features/finance/financeApi";
import { Button } from "@/components/ui/button";
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
  PENDING: "معلّقة",
  COLLECTION: "تحصيل",
  PAID: "مدفوعة",
  LATE: "متأخرة",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  COLLECTION: "default",
  PAID: "secondary",
  LATE: "destructive",
};


export default function FinanceTicketsPage() {
  const { data, isLoading, isError } = useGetPaymentTicketsQuery({ limit: 30 });
  const [resolveTicket, { isLoading: resolving }] = useResolvePaymentTicketMutation();

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التذاكر المالية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          طلبات مالية داخلية ومتابعة الحالة.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            قائمة التذاكر
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
            <p className="text-sm text-destructive">حدث خطأ أثناء تحميل التذاكر.</p>
          )}
          {!isLoading && !isError && data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">ملاحظات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      لا توجد تذاكر مالية.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {ticket.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[ticket.status] ?? "outline"}>
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell dir="ltr">
                      {new Date(ticket.createdAt).toLocaleDateString("ar-DZ")}
                    </TableCell>
                    <TableCell>
                      {ticket.status !== "PAID" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={resolving}
                          onClick={() => resolveTicket(ticket.id)}
                        >
                          إنهاء
                        </Button>
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
