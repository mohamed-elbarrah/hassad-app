import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { TaskDepartment, UserRole } from "@hassad/shared";
import { PrismaService } from "../../../prisma/prisma.service";

export type TaskAccessAction =
  | "detail"
  | "history"
  | "comments"
  | "files"
  | "download"
  | "mutation"
  | "management";

export interface TaskAccessUser {
  id: string;
  role: UserRole | string;
}

export interface TaskAccessDecision {
  isFormerAssignee: boolean;
  canViewAllAssignmentHistory: boolean;
}

export interface ProjectTaskReadScope {
  taskWhere: Prisma.TaskWhereInput;
  taskRelationWhere: Prisma.TaskWhereInput;
  assignmentHistoryWhere: Prisma.TaskAssignmentHistoryWhereInput;
  canViewAllTasks: boolean;
}

/** Central policy for the generic /tasks resource routes. */
@Injectable()
export class TaskAccessPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectTaskReadScope(
    projectId: string,
    user: TaskAccessUser,
  ): Promise<ProjectTaskReadScope> {
    const role = user.role as UserRole | string;
    if (role === UserRole.ADMIN || role === "OWNER") {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!project) this.denyProject(projectId);
      return {
        taskWhere: { projectId },
        taskRelationWhere: {},
        assignmentHistoryWhere: {},
        canViewAllTasks: true,
      };
    }

    if (role === UserRole.PM) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, projectManagerId: user.id },
        select: { id: true },
      });
      if (!project) this.denyProject(projectId);
      return {
        taskWhere: { projectId },
        taskRelationWhere: {},
        assignmentHistoryWhere: {},
        canViewAllTasks: true,
      };
    }

    if (role !== UserRole.TEAM && role !== UserRole.MARKETING) {
      this.denyProject(projectId);
    }

    const taskRelationWhere: Prisma.TaskWhereInput = {
      ...(role === UserRole.MARKETING
        ? { department: { name: TaskDepartment.MARKETING } }
        : {}),
      OR: [
        { assignedTo: user.id },
        {
          assignmentHistory: {
            some: {
              OR: [{ previousAssigneeId: user.id }, { newAssigneeId: user.id }],
            },
          },
        },
      ],
    };

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { members: { some: { userId: user.id, user: { isActive: true } } } },
          { tasks: { some: taskRelationWhere } },
        ],
      },
      select: { id: true },
    });
    if (!project) this.denyProject(projectId);

    const assignmentHistoryWhere: Prisma.TaskAssignmentHistoryWhereInput = {
      OR: [{ previousAssigneeId: user.id }, { newAssigneeId: user.id }],
    };
    return {
      taskWhere: { projectId, ...taskRelationWhere },
      taskRelationWhere,
      assignmentHistoryWhere,
      canViewAllTasks: false,
    };
  }

  async authorize(
    taskId: string,
    user: TaskAccessUser,
    action: TaskAccessAction,
  ): Promise<TaskAccessDecision> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        assignedTo: true,
        archivedAt: true,
        department: { select: { name: true } },
        project: { select: { projectManagerId: true } },
        assignmentHistory: {
          where: {
            OR: [{ previousAssigneeId: user.id }, { newAssigneeId: user.id }],
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!task) this.deny(taskId);

    const role = user.role as UserRole | string;
    const isFullAccess = role === UserRole.ADMIN || role === "OWNER";
    const isManager =
      role === UserRole.PM && task.project.projectManagerId === user.id;
    const isCurrentAssignee =
      task.assignedTo === user.id &&
      !task.archivedAt &&
      (role === UserRole.TEAM ||
        (role === UserRole.MARKETING &&
          task.department.name === TaskDepartment.MARKETING));
    const isFormerAssignee =
      (role === UserRole.TEAM || role === UserRole.MARKETING) &&
      task.assignmentHistory.length > 0 &&
      (role !== UserRole.MARKETING ||
        task.department.name === TaskDepartment.MARKETING);

    if (
      isFullAccess ||
      isManager ||
      (isCurrentAssignee && action !== "management")
    ) {
      return {
        isFormerAssignee: false,
        canViewAllAssignmentHistory: isFullAccess || isManager,
      };
    }

    const formerReadAction =
      action === "detail" ||
      action === "history" ||
      action === "comments" ||
      action === "files" ||
      action === "download";
    if (isFormerAssignee && formerReadAction) {
      return {
        isFormerAssignee: true,
        canViewAllAssignmentHistory: false,
      };
    }

    this.deny(taskId);
  }

  async authorizeDownload(
    taskId: string,
    fileId: string,
    user: TaskAccessUser,
  ): Promise<void> {
    await this.authorize(taskId, user, "download");
    const fileExists = await this.prisma.taskFile.findFirst({
      where: { id: fileId, taskId },
      select: { id: true },
    });
    if (!fileExists) this.deny(taskId);
  }

  private denyProject(projectId: string): never {
    throw new NotFoundException({
      code: "PROJECT_NOT_FOUND",
      details: { projectId },
    });
  }

  private deny(taskId: string): never {
    throw new NotFoundException({
      code: "TASK_NOT_FOUND",
      details: { taskId },
    });
  }
}
