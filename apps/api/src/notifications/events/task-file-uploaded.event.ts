export class TaskFileUploadedEvent {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly assignedToUserId: string,
    public readonly uploaderName: string,
    public readonly fileName: string,
  ) {}
}
