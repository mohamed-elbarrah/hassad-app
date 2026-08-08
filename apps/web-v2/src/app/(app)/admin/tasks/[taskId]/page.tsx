import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Task Detail | Hassad",
};

export default function TaskDetailPage() {
  return <ScreenPlaceholder label="Task Detail" />;
}
