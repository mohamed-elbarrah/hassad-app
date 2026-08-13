import type { Metadata } from "next";

import { PmTasksWorkspace } from "@/features/pm-tasks/components/pm-tasks-workspace";

export const metadata: Metadata = {
  title: "PM Tasks | Hassad",
};

export default function TasksPage() {
  return <PmTasksWorkspace />;
}
