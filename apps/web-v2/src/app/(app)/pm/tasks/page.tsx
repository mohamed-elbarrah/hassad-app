import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "PM Tasks | Hassad",
};

export default function TasksPage() {
  return <ScreenPlaceholder label="Tasks" />;
}
