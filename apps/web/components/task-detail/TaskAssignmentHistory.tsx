import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export interface TaskAssignmentHistoryEntry {
  id: string;
  previousAssignee?: { id: string; name: string } | null;
  newAssignee?: { id: string; name: string } | null;
  changer?: { id: string; name: string } | null;
  reason: string | null;
  createdAt: string | Date;
}

export function TaskAssignmentHistory({
  entries,
}: {
  entries: TaskAssignmentHistoryEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل إسناد المهمة</CardTitle>
        <CardDescription>تغييرات الإسناد وأسبابها.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap gap-2 text-muted-foreground">
              <span>{formatDateTime(entry.createdAt)}</span>
              {entry.previousAssignee?.name ? (
                <span>من: {entry.previousAssignee.name}</span>
              ) : (
                <span>من: غير معيّن</span>
              )}
              {entry.newAssignee?.name ? (
                <span>إلى: {entry.newAssignee.name}</span>
              ) : null}
              {entry.changer?.name ? (
                <span>بواسطة: {entry.changer.name}</span>
              ) : null}
            </div>
            {entry.reason ? (
              <p className="mt-2 whitespace-pre-wrap">{entry.reason}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
