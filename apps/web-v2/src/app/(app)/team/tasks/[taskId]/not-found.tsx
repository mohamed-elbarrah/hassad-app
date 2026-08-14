import { StateBlock } from "@/components/patterns/state-block";

export default function TeamTaskNotFound() {
  return <StateBlock title="Task not found" description="This task does not exist or is not assigned to your account." />;
}
