"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CLIENTS = [
  { id: "m1", name: "شركة النور", campaigns: "3 حملات" },
  { id: "m2", name: "مطعم الريحان", campaigns: "2 حملات" },
];

export default function MarketingClientsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">عملاء التسويق</h1>
        <p className="text-sm text-muted-foreground mt-1">
          قائمة العملاء المرتبطين بالحملات التسويقية.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">عدد الحملات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CLIENTS.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.campaigns}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
