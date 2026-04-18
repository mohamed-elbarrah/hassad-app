export class TaskCommentAddedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly assignedToUserId: string,
    public readonly commenterId: string,
    public readonly commenterName: string,
  ) {}
}
