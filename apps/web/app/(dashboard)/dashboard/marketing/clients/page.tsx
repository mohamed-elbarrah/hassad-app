"use client";

import Link from "next/link";
import { ClientStatus } from "@hassad/shared";
import { useGetClientsQuery } from "@/features/clients/clientsApi";
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

export default function MarketingClientsPage() {
  const { data, isLoading, isError } = useGetClientsQuery({
    status: ClientStatus.ACTIVE,
    limit: 30,
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">عملاء التسويق</h1>
        <p className="text-sm text-muted-foreground mt-1">
          العملاء النشطون والحملات المرتبطة بهم.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            قائمة العملاء
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
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">حدث خطأ أثناء تحميل العملاء.</p>
          )}
          {!isLoading && !isError && data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم الشركة</TableHead>
                  <TableHead className="text-right">نوع النشاط</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الحملات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      لا يوجد عملاء.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((client) => {
                  const name = (client as any).companyName ?? (client as any).name ?? "—";
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {(client as any).businessType ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{(client as any).status ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/marketing/campaigns?clientId=${client.id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          عرض الحملات
                        </Link>
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
