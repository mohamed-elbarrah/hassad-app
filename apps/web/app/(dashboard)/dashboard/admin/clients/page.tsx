"use client";

import { useState, useEffect } from "react";
import { Search, UserCheck, UserX, Users } from "lucide-react";
import {
  useSearchUsersQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  type UserDetail,
} from "@/features/users/usersApi";
import { ActionButton } from "@/components/design-system/ActionButton";
import { SurfaceCard } from "@/components/design-system/SurfaceCard";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { Skeleton } from "@/components/design-system/Skeleton";
import { Pill } from "@/components/design-system/Pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

// ── Debounce hook ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminClientsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const debouncedSearch = useDebounce(searchInput, 400);

  const { data, isLoading, isError } = useSearchUsersQuery({
    search: debouncedSearch || undefined,
    role: "CLIENT",
    limit: 50,
  });

  const [deactivateUser, { isLoading: isDeactivating }] =
    useDeactivateUserMutation();
  const [reactivateUser, { isLoading: isReactivating }] =
    useReactivateUserMutation();
  const isToggling = isDeactivating || isReactivating;

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    try {
      if (currentlyActive) {
        await deactivateUser(id).unwrap();
        toast.success("تم تعطيل حساب العميل.");
      } else {
        await reactivateUser(id).unwrap();
        toast.success("تم تفعيل حساب العميل.");
      }
    } catch {
      toast.error("فشلت العملية. يرجى المحاولة مجدداً.");
    }
  }

  const allClients = (data?.items ?? []) as UserDetail[];

  const clients = allClients.filter((c) => {
    if (statusFilter === "active") return c.isActive;
    if (statusFilter === "inactive") return !c.isActive;
    return true;
  });

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold">إدارة حسابات العملاء</h1>
        </div>
        <div className="text-sm text-neutral-300">
          إجمالي: <span className="font-semibold text-foreground">{data?.total ?? 0}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-neutral-300" />
          <FormInputControl
            placeholder="ابحث بالاسم أو الإيميل..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((s) => (
            <ActionButton
              key={s}
              variant={statusFilter === s ? "primary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" && "الكل"}
              {s === "active" && "نشط"}
              {s === "inactive" && "معطل"}
            </ActionButton>
          ))}
        </div>
      </div>

      {/* Table */}
      <SurfaceCard>
        {isLoading && (
          <div className="space-y-2">
            <div className="flex gap-6 px-4 py-3 bg-neutral-50/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-6 px-4 py-3 border-t">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-danger-500 px-4 py-6 text-center">
            حدث خطأ أثناء تحميل العملاء. يرجى تحديث الصفحة.
          </p>
        )}

        {!isLoading && !isError && clients && (
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/50">
                <TableHead className="text-right font-semibold">الاسم</TableHead>
                <TableHead className="text-right font-semibold">البريد الإلكتروني</TableHead>
                <TableHead className="text-right font-semibold">الحالة</TableHead>
                <TableHead className="text-right font-semibold">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right font-semibold">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-neutral-300">
                    <p className="text-lg font-medium">لا يوجد عملاء</p>
                    <p className="text-sm mt-1">لا توجد نتائج مطابقة للبحث</p>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-neutral-50/50">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell dir="ltr" className="text-neutral-300 text-sm">
                      {client.email}
                    </TableCell>
                    <TableCell>
                      <Pill tone={client.isActive ? "success" : "danger"}>
                        {client.isActive ? "نشط" : "معطل"}
                      </Pill>
                    </TableCell>
                    <TableCell dir="ltr" className="text-neutral-300 text-sm">
                      {new Date(client.createdAt).toLocaleDateString("ar-SA")}
                    </TableCell>
                    <TableCell>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        disabled={isToggling}
                        onClick={() => handleToggleActive(client.id, client.isActive)}
                        className={
                          client.isActive
                            ? "text-danger-500 hover:text-danger-500"
                            : "text-success-600 hover:text-success-600"
                        }
                      >
                        {client.isActive ? (
                          <>
                            <UserX className="size-3.5 mr-1" />
                            تعطيل
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-3.5 mr-1" />
                            تفعيل
                          </>
                        )}
                      </ActionButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </SurfaceCard>
    </div>
  );
}
