"use client";

import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

interface DisputeEmptyStateProps {
  hasFilter?: boolean;
  onCreateNew?: () => void;
  canCreate?: boolean;
}

export function DisputeEmptyState({
  hasFilter = false,
  onCreateNew,
  canCreate = true,
}: DisputeEmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8">
        <Empty>
          <EmptyMedia variant="icon">
            <Ticket aria-hidden="true" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{hasFilter ? "لا توجد تذاكر تطابق بحثك" : "لا توجد تذاكر نزاع"}</EmptyTitle>
            <EmptyDescription>
              {hasFilter
                ? "حاول تعديل البحث أو الفلاتر لعرض نتائج أكثر."
                : "ستظهر هنا جميع تذاكر النزاع الخاصة بك عند إنشائها أو استلامها."}
            </EmptyDescription>
          </EmptyHeader>
          {canCreate && onCreateNew && !hasFilter ? (
            <EmptyContent>
              <Button onClick={onCreateNew}>فتح تذكرة جديدة</Button>
            </EmptyContent>
          ) : null}
        </Empty>
      </CardContent>
    </Card>
  );
}
