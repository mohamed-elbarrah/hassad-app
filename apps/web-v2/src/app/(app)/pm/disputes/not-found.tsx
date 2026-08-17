import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Dispute not found</EmptyTitle>
        <EmptyDescription>
          The dispute may have been archived, reassigned, or you may not have access to it.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
