import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Settings | Hassad",
};

export default function SettingsPage() {
  return <ScreenPlaceholder label="Settings" />;
}
