import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Client Detail | Hassad",
};

export default function ClientDetailPage() {
  return <ScreenPlaceholder label="Client Detail" />;
}
