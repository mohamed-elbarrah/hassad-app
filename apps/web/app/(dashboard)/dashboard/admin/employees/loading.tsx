import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="size-12 rounded-md" />
      </CardContent>
    </Card>
  );
}

function TableLoadingSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الموظف</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>القسم</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>المهام</TableHead>
            <TableHead>آخر تسجيل دخول</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: 7 }).map((__, cell) => (
                <TableCell key={cell}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Loading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl">
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <Skeleton className="h-10 lg:col-span-2" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-px w-full" />
          <TableLoadingSkeleton />
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
