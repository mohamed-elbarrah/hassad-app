import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { NotificationsService } from "../notifications.service";
import { NotificationType } from "@prisma/client";
import { NOTIFICATION_EVENTS } from "../events/notification-events.enum";
import { TaskAssignedEvent } from "../events/task-assigned.event";
import { TaskUpdatedEvent } from "../events/task-updated.event";
import { TaskStatusChangedEvent } from "../events/task-status-changed.event";
import { TaskCommentAddedEvent } from "../events/task-comment-added.event";
import { TaskFileUploadedEvent } from "../events/task-file-uploaded.event";

@Injectable()
export class TaskNotificationHandler {
  private readonly logger = new Logger(TaskNotificationHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATION_EVENTS.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
    try {
      await this.notificationsService.createNotification({
        userId: event.assignedToUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: "تم تعيينك في مهمة جديدة",
        message: `تم تعيينك في المهمة "${event.taskTitle}"`,
        entityId: event.taskId,
        entityType: "task",
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle task.assigned for task ${event.taskId}`,
        error,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_UPDATED)
  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    try {
      await this.notificationsService.createNotification({
        userId: event.assignedToUserId,
        type: NotificationType.TASK_UPDATED,
        title: "تم تحديث المهمة",
        message: `قام ${event.updatedByName} بتحديث المهمة "${event.taskTitle}"`,
        entityId: event.taskId,
        entityType: "task",
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle task.updated for task ${event.taskId}`,
        error,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_STATUS_CHANGED)
  async handleTaskStatusChanged(event: TaskStatusChangedEvent): Promise<void> {
    const message = `تحولت المهمة "${event.taskTitle}" من ${event.oldStatus} إلى ${event.newStatus}`;

    const notifications: Promise<void>[] = [
      this.notificationsService.createNotification({
        userId: event.assignedToUserId,
        type: NotificationType.TASK_STATUS_CHANGED,
        title: "تغيّر حالة المهمة",
        message,
        entityId: event.taskId,
        entityType: "task",
      }),
    ];

    // Notify PM if they are different from the assignee
    if (event.projectManagerId !== event.assignedToUserId) {
      notifications.push(
        this.notificationsService.createNotification({
          userId: event.projectManagerId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: "تغيّر حالة المهمة",
          message,
          entityId: event.taskId,
          entityType: "task",
        }),
      );
    }

    await Promise.allSettled(notifications).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          this.logger.error(
            `Failed to send status-changed notification for task ${event.taskId}`,
            result.reason,
          );
        }
      }
    });
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_COMMENT_ADDED)
  async handleTaskCommentAdded(event: TaskCommentAddedEvent): Promise<void> {
    // Do NOT notify if the commenter is the assignee
    if (event.commenterId === event.assignedToUserId) {
      return;
    }

    try {
      await this.notificationsService.createNotification({
        userId: event.assignedToUserId,
        type: NotificationType.TASK_COMMENT_ADDED,
        title: "تعليق جديد على المهمة",
        message: `علّق ${event.commenterName} على المهمة "${event.taskTitle}"`,
        entityId: event.taskId,
        entityType: "task",
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle task.comment.added for task ${event.taskId}`,
        error,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_FILE_UPLOADED)
  async handleTaskFileUploaded(event: TaskFileUploadedEvent): Promise<void> {
    try {
      await this.notificationsService.createNotification({
        userId: event.assignedToUserId,
        type: NotificationType.TASK_FILE_UPLOADED,
        title: "ملف جديد في المهمة",
        message: `رفع ${event.uploaderName} الملف "${event.fileName}" للمهمة "${event.taskTitle}"`,
        entityId: event.taskId,
        entityType: "task",
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle task.file.uploaded for task ${event.taskId}`,
        error,
      );
    }
  }
}
