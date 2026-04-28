"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  useGetDeliverablesByClientQuery,
  useCreateRevisionMutation,
} from "@/features/deliverables/deliverablesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  TODO: "معلّق",
  IN_PROGRESS: "جارٍ",
  IN_REVIEW: "مراجعة",
  DONE: "معتمد",
  REVISION: "يحتاج تعديل",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  TODO: "outline",
  IN_PROGRESS: "default",
  IN_REVIEW: "secondary",
  DONE: "secondary",
  REVISION: "destructive",
};

export default function PortalDeliverablesPage() {
  const { user } = useAppSelector((state) => state.auth);
  const clientId = user?.clientId ?? "";

  const { data: deliverables, isLoading, isError } = useGetDeliverablesByClientQuery(
    clientId,
    { skip: !clientId },
  );
  const [createRevision] = useCreateRevisionMutation();

  const [revisionFor, setRevisionFor] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitRevision(deliverableId: string) {
    if (!revisionText.trim()) return;
    setSubmitting(true);
    try {
      await createRevision({
        deliverableId,
        body: { description: revisionText },
      }).unwrap();
      setRevisionFor(null);
      setRevisionText("");
    } finally {
      setSubmitting(false);
    }
  }

  const visible = deliverables?.filter((d) => d.isVisibleToClient);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-semibold">التسليمات</h1>
        <p className="text-sm text-muted-foreground mt-1">
          استعراض الأعمال وتسليمات المشروع.
        </p>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">
          لم يتم ربط حسابك بملف عميل.
        </p>
      )}

      {clientId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">قائمة التسليمات</CardTitle>
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
              <p className="text-sm text-destructive">حدث خطأ أثناء تحميل التسليمات.</p>
            )}
            {!isLoading && !isError && (
              <div className="flex flex-col gap-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم العمل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تحميل</TableHead>
                      <TableHead className="text-right">طلب تعديل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!visible || visible.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          لا توجد تسليمات متاحة حالياً.
                        </TableCell>
                      </TableRow>
                    )}
                    {visible?.map((item) => (
                      <>
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANT[item.status] ?? "outline"}>
                              {STATUS_LABELS[item.status] ?? item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <a
                              href={item.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                تحميل
                              </Button>
                            </a>
                          </TableCell>
                          <TableCell>
                            {item.status !== "DONE" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setRevisionFor(
                                    revisionFor === item.id ? null : item.id,
                                  )
                                }
                              >
                                طلب تعديل
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {revisionFor === item.id && (
                          <TableRow key={`rev-${item.id}`}>
                            <TableCell colSpan={4}>
                              <div className="flex flex-col gap-2 p-2">
                                <Textarea
                                  placeholder="اكتب تفاصيل التعديل المطلوب..."
                                  value={revisionText}
                                  onChange={(e) => setRevisionText(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setRevisionFor(null);
                                      setRevisionText("");
                                    }}
                                  >
                                    إلغاء
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={submitting || !revisionText.trim()}
                                    onClick={() => submitRevision(item.id)}
                                  >
                                    {submitting ? "جارٍ الإرسال..." : "إرسال الطلب"}
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
