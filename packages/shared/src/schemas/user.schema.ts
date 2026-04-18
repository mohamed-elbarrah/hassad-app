import { z } from "zod";
import { UserRole } from "../enums/roles";
import { TaskDepartment } from "../enums/project";

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
  department: z.nativeEnum(TaskDepartment).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    role: z.nativeEnum(UserRole).optional(),
    department: z.nativeEnum(TaskDepartment).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
