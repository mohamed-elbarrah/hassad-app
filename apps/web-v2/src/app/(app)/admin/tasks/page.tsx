import type { Metadata } from "next";

import { TasksWorkspace } from "@/features/tasks/components/tasks-workspace";

export const metadata: Metadata = {
  title: "Tasks | Hassad",
};

export default function TasksPage() {
  return <TasksWorkspace />;
}
