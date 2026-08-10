import { ChatPreviewWorkspace } from "@/features/chat/components/chat-preview-workspace";
import { PageScaffold } from "@/components/patterns/page-scaffold";

export default function ChatPreviewPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-[120rem] flex-col gap-6 p-4 md:p-6">
        <PageScaffold
          title="Chat preview"
          description="Global chat UI review route for direct messages, groups, embedded comment threads, and dispute-style messaging before API integration."
        >
          <ChatPreviewWorkspace />
        </PageScaffold>
      </div>
    </main>
  );
}
