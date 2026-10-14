"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { TASK_DEPARTMENT_AR, USER_ROLE_AR } from "@hassad/shared";
import {
  useGetAdminTaskEligibleAssigneesQuery,
  useReassignAdminTaskMutation,
  type AdminTaskEligibleAssignee,
} from "@/features/admin/adminTasksApi";
import { adminErrorMessage } from "@/lib/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

export function AdminTaskReassignmentDialog({
  taskId,
  currentAssignee,
  onSuccess,
}: {
  taskId: string;
  currentAssignee: { name: string } | null;
  onSuccess?: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [search]);
  const [selectedAssignee, setSelectedAssignee] =
    useState<AdminTaskEligibleAssignee | null>(null);
  const [reason, setReason] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [reassign, { isLoading, error, reset }] =
    useReassignAdminTaskMutation();
  const {
    data: assignees,
    isFetching: isSearching,
    isError: isAssigneeError,
    error: assigneeError,
    refetch: refetchAssignees,
  } = useGetAdminTaskEligibleAssigneesQuery(
    { taskId, search: debouncedSearch },
    { skip: !open },
  );

  const reasonIsValid = reason.trim().length > 0;
  const canSubmit = selectedAssignee !== null && reasonIsValid && !isLoading;

  const confirmReassignment = async () => {
    if (!selectedAssignee || !reasonIsValid) return;
    try {
      const result = await reassign({
        id: taskId,
        assigneeId: selectedAssignee.id,
        reason: reason.trim(),
      }).unwrap();
      onSuccess?.(result.code);
      setConfirmationOpen(false);
      setOpen(false);
    } catch {
      // The normalized mutation error is presented below through adminErrorMessage.
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            reset();
            setPickerOpen(false);
            setSearch("");
            setDebouncedSearch("");
            setSelectedAssignee(null);
            setReason("");
            setConfirmationOpen(false);
          }
          setOpen(nextOpen);
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" className="min-h-11">
            إعادة تعيين المهمة
          </Button>
        </DialogTrigger>
        <DialogContent
          dir="rtl"
          className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle>إعادة تعيين المهمة</DialogTitle>
            <DialogDescription>
              المكلّف الحالي: {currentAssignee?.name ?? "غير معيّن"}. ابحث عن
              موظف مؤهل، ثم اكتب سبباً موثقاً لإعادة التعيين.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-task-assignee-picker">المكلّف الجديد</Label>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="admin-task-assignee-picker"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    className="min-h-11 w-full justify-between font-normal"
                  >
                    <span
                      className={
                        selectedAssignee
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {selectedAssignee?.name ??
                        "ابحث بالاسم أو البريد الإلكتروني"}
                    </span>
                    <ChevronsUpDown data-icon="inline-end" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[min(100vw-3rem,32rem)] p-0"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      maxLength={200}
                      value={search}
                      onValueChange={setSearch}
                      placeholder="ابحث بالاسم أو البريد الإلكتروني"
                      aria-label="البحث عن موظف مؤهل"
                    />
                    <CommandList>
                      {isSearching ? (
                        <div
                          className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground"
                          role="status"
                        >
                          <Loader2 className="animate-spin" /> جارٍ البحث...
                        </div>
                      ) : isAssigneeError ? (
                        <div className="flex flex-col items-center gap-2 p-3">
                          <CommandEmpty>
                            {adminErrorMessage(assigneeError)}
                          </CommandEmpty>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="min-h-11"
                            onClick={() => void refetchAssignees()}
                          >
                            إعادة المحاولة
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>لا توجد نتائج مطابقة</CommandEmpty>
                          <CommandGroup heading="الموظفون المؤهلون">
                            {(assignees?.items ?? []).map((assignee) => (
                              <CommandItem
                                key={assignee.id}
                                value={assignee.id}
                                onSelect={() => {
                                  setSelectedAssignee(assignee);
                                  setPickerOpen(false);
                                }}
                                className="min-h-12"
                              >
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className="truncate font-medium">
                                    {assignee.name}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {assignee.email} ·{" "}
                                    {USER_ROLE_AR[
                                      assignee.role as keyof typeof USER_ROLE_AR
                                    ] ?? assignee.role}{" "}
                                    ·{" "}
                                    {TASK_DEPARTMENT_AR[
                                      assignee.department as keyof typeof TASK_DEPARTMENT_AR
                                    ] ?? assignee.department}
                                  </span>
                                </div>
                                {selectedAssignee?.id === assignee.id ? (
                                  <Check data-icon="inline-end" />
                                ) : null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="admin-task-reassignment-reason">
                سبب إعادة التعيين
              </Label>
              <Textarea
                id="admin-task-reassignment-reason"
                maxLength={1000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="اكتب سبباً واضحاً ومختصراً"
                aria-required="true"
                aria-invalid={reason.length > 0 && !reasonIsValid}
                rows={4}
              />
              {!reasonIsValid ? (
                <p className="text-sm text-muted-foreground">
                  السبب مطلوب قبل المتابعة.
                </p>
              ) : null}
            </div>
            {error && !confirmationOpen ? (
              <p role="alert" className="text-sm text-destructive">
                {adminErrorMessage(error)}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={!canSubmit}
              onClick={() => setConfirmationOpen(true)}
            >
              <Search data-icon="inline-start" /> مراجعة وإعادة التعيين
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إعادة تعيين المهمة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم نقل المهمة من «{currentAssignee?.name ?? "غير معيّن"}» إلى «
              {selectedAssignee?.name}». السبب: {reason.trim()}. وسيُحفظ التغيير
              في سجل الإسناد.
            </AlertDialogDescription>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {adminErrorMessage(error)}
              </p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11" disabled={isLoading}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              disabled={isLoading}
              onClick={(event) => {
                event.preventDefault();
                void confirmReassignment();
              }}
            >
              {isLoading ? "جارٍ التنفيذ..." : "تأكيد إعادة التعيين"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
