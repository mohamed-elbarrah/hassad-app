export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly assignedToUserId: string,
    public readonly projectManagerId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}
