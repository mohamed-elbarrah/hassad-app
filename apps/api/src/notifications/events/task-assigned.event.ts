export class TaskAssignedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly assignedToUserId: string,
    public readonly projectId: string,
  ) {}
}
