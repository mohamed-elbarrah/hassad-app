import { z } from "zod";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TaskDepartment,
} from "../enums/project";

/**
 * CreateProjectSchema — validates input required to create a new project.
 * Dates are ISO date strings (YYYY-MM-DD) — backend uses @IsDateString().
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  clientId: z.string().min(1, "Client ID is required"),
  contractId: z.string().optional().nullable(),
  projectManagerId: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(TaskPriority),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/**
 * UpdateProjectSchema — partial update of a project's mutable fields.
 * At least one field must be provided.
 */
export const UpdateProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, "Project name must be at least 2 characters")
      .optional(),
    description: z.string().optional().nullable(),
    contractId: z.string().optional().nullable(),
    projectManagerId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    progress: z.number().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * UpdateProjectStatusSchema — validates a project status transition.
 */
export const UpdateProjectStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
});

export type UpdateProjectStatusInput = z.infer<
  typeof UpdateProjectStatusSchema
>;

/**
 * CreateTaskSchema — validates input required to create a new task.
 * dept is the TaskDepartment enum name; the server resolves it to a UUID.
 * status defaults to TODO on server.
 */
export const CreateTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID format"),
  dept: z.nativeEnum(TaskDepartment),
  title: z.string().min(2, "Task title must be at least 2 characters"),
  assignedTo: z.string().uuid("Invalid user ID format").optional(),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.NORMAL),
  dueDate: z.coerce.date(),
  description: z.string().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

/**
 * UpdateTaskSchema — partial update of a task's mutable fields.
 * At least one field must be provided.
 */
export const UpdateTaskSchema = z
  .object({
    title: z
      .string()
      .min(2, "Task title must be at least 2 characters")
      .optional(),
    assignedTo: z.string().cuid("Invalid user ID format").optional(),
    dept: z.nativeEnum(TaskDepartment).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.coerce.date().optional(),
    description: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

/**
 * UpdateTaskStatusSchema — validates a task status transition.
 */
export const UpdateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;
