import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Client Projects | Hassad",
};

export default function ClientProjectsPage() {
  return <ScreenPlaceholder label="Client Projects" />;
}
