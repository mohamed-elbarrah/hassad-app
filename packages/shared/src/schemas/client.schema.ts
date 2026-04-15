import { z } from 'zod';
import { ClientStatus, PipelineStage, BusinessType, ClientSource } from '../enums/client';

/**
 * CreateClientSchema — validates the input required to create a new client.
 * Matches the Prisma `Client` model's writable fields exactly.
 * `status`, `stage`, and `assignedToId` are set by server logic, not client input.
 */
export const CreateClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().min(5, 'Phone must be at least 5 characters'),
  businessType: z.nativeEnum(BusinessType),
  source: z.nativeEnum(ClientSource),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

/**
 * UpdateClientSchema — validates partial updates to an existing client.
 * All fields are optional; at least one must be provided.
 * Stage and status transitions have dedicated endpoints.
 */
export const UpdateClientSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().min(5, 'Phone must be at least 5 characters').optional(),
    businessType: z.nativeEnum(BusinessType).optional(),
    source: z.nativeEnum(ClientSource).optional(),
    status: z.nativeEnum(ClientStatus).optional(),
    stage: z.nativeEnum(PipelineStage).optional(),
    assignedToId: z.string().cuid('Invalid user ID format').optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

/**
 * UpdateStageSchema — validates a pipeline stage transition.
 */
export const UpdateStageSchema = z.object({
  stage: z.nativeEnum(PipelineStage),
});

export type UpdateStageInput = z.infer<typeof UpdateStageSchema>;
