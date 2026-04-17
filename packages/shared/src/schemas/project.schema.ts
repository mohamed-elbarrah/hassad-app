import { z } from "zod";
import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  TaskDepartment,
} from "../enums/project";

/**
 * CreateProjectSchema — validates input required to create a new project.
 * projectId comes from route params; status/progress are server-controlled.
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  clientId: z.string().cuid("Invalid client ID format"),
  contractId: z
    .string()
    .cuid("Invalid contract ID format")
    .optional()
    .nullable(),
  managerId: z.string().cuid("Invalid manager ID format"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
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
    contractId: z
      .string()
      .cuid("Invalid contract ID format")
      .optional()
      .nullable(),
    managerId: z.string().cuid("Invalid manager ID format").optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
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
 * projectId comes from route params; status is server-controlled (defaults to TODO).
 */
export const CreateTaskSchema = z.object({
  title: z.string().min(2, "Task title must be at least 2 characters"),
  assignedTo: z.string().cuid("Invalid user ID format"),
  dept: z.nativeEnum(TaskDepartment),
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
