export class TaskUpdatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly assignedToUserId: string,
    public readonly updatedByName: string,
  ) {}
}
