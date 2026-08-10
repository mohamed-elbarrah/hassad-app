import type { Metadata } from "next";

import { ScreenPlaceholder } from "@/components/patterns/screen-placeholder";

export const metadata: Metadata = {
  title: "Marketing Chat | Hassad",
};

export default function ChatPage() {
  return <ScreenPlaceholder label="Chat" />;
}
