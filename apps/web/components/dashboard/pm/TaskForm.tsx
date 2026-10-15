"use client";

import { TaskCreationForm } from "@/components/tasks/TaskCreationForm";
import { useCreatePmProjectTaskMutation } from "@/features/tasks/tasksApi";
import { pmErrorMessage, pmSuccessMessage } from "@/lib/i18n";

interface TaskFormProps {
  projectId: string;
  periodId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaskForm({ projectId, periodId, open, onOpenChange }: TaskFormProps) {
  const [createTask] = useCreatePmProjectTaskMutation();

  return (
    <TaskCreationForm
      projectId={projectId}
      periodId={periodId}
      assigneePortal="pm"
      creatorLabel="مدير المشروع"
      open={open}
      onOpenChange={onOpenChange}
      onCreate={async (values) => {
        await createTask({ projectId, periodId, ...values }).unwrap();
      }}
      successMessage={() => pmSuccessMessage("TASK_CREATED")}
      errorMessage={pmErrorMessage}
    />
  );
}
