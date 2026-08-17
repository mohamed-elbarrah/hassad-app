"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <div dir="rtl" className="p-4 sm:p-6 lg:p-8">
      <Card><CardContent className="p-8"><Empty><EmptyMedia variant="icon"><FolderKanban /></EmptyMedia><EmptyHeader><EmptyTitle>حدث خطأ أثناء تحميل بيانات المشروع</EmptyTitle><EmptyDescription>تعذر جلب التفاصيل. حاول مرة أخرى.</EmptyDescription></EmptyHeader><EmptyContent><div className="flex flex-wrap justify-center gap-2"><Button onClick={reset}>إعادة المحاولة</Button><Button variant="outline" asChild><Link href="/dashboard/admin/projects">العودة للمشاريع</Link></Button></div></EmptyContent></Empty></CardContent></Card>
    </div>
  );
}
