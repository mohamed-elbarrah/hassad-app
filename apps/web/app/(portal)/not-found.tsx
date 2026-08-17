import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function PortalNotFound() {
  return (
    <main dir="rtl" className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion />
          </EmptyMedia>
          <EmptyTitle>الصفحة غير موجودة</EmptyTitle>
          <EmptyDescription>
            الرابط الذي تبحث عنه غير متوفر أو تم نقله.
          </EmptyDescription>
        </EmptyHeader>
        <Link href="/portal">
          <ArrowRight data-icon="inline-start" />
          العودة للبوابة
        </Link>
      </Empty>
    </main>
  );
}
