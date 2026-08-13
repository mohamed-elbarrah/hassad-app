import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Dispute not found</EmptyTitle>
        <EmptyDescription>
          The PM dispute detail page could not find a matching record.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
