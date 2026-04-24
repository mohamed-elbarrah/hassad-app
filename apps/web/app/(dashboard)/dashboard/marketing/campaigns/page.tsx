"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CAMPAIGNS = [
  { id: "c1", client: "شركة النور", name: "حملة الربيع", status: "نشطة" },
  { id: "c2", client: "مطعم الريحان", name: "حملة العروض", status: "متوقفة" },
];

export default function MarketingCampaignsPage() {
  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">الحملات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          الحملات المرتبطة بكل عميل.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قائمة الحملات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">اسم الحملة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAMPAIGNS.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/marketing/campaigns/${campaign.id}`}
                      className="hover:underline"
                    >
                      {campaign.client}
                    </Link>
                  </TableCell>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell>{campaign.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
