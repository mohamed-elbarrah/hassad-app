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

const CONTRACTS = [
  {
    id: "fc1",
    client: "شركة النور",
    value: "200,000 دج",
    paid: "120,000 دج",
    remaining: "80,000 دج",
  },
  {
    id: "fc2",
    client: "مطعم الريحان",
    value: "150,000 دج",
    paid: "90,000 دج",
    remaining: "60,000 دج",
  },
];

export default function FinanceContractsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">العقود (مالية)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          قيمة العقد والمدفوع والمتبقي لكل عميل.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة العقود</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">قيمة العقد</TableHead>
                <TableHead className="text-right">المدفوع</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CONTRACTS.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.client}
                  </TableCell>
                  <TableCell>{contract.value}</TableCell>
                  <TableCell>{contract.paid}</TableCell>
                  <TableCell>{contract.remaining}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
