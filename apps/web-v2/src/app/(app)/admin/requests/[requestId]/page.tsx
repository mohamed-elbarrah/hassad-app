import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Request Detail | Hassad",
};

export default function RequestDetailPage() {
  return <ScreenPlaceholder label="Request Detail" />;
}
