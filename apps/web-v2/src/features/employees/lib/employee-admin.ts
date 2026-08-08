import { TaskDepartment, UserRole } from "@hassad/shared";
import { z } from "zod";

import { employees } from "@/lib/fixtures/first-slice";

export type EmployeeAdminRecord = {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  department?: TaskDepartment;
  phoneWhatsapp?: string;
  salary: number;
  startDate: string;
  lastSeen: string;
  isActive: boolean;
};

export const employeeRoleOptions = [
  UserRole.ADMIN,
  UserRole.PM,
  UserRole.SALES,
  UserRole.TEAM,
  UserRole.MARKETING,
  UserRole.ACCOUNTANT,
] as const;

export type EmployeeAssignableRole = (typeof employeeRoleOptions)[number];

export const departmentOptions = [
  TaskDepartment.DESIGN,
  TaskDepartment.CONTENT,
  TaskDepartment.DEVELOPMENT,
  TaskDepartment.MARKETING,
  TaskDepartment.PRODUCTION,
] as const;

const departmentLabelMap: Record<TaskDepartment, string> = {
  [TaskDepartment.DESIGN]: "Design",
  [TaskDepartment.CONTENT]: "Content",
  [TaskDepartment.DEVELOPMENT]: "Development",
  [TaskDepartment.MARKETING]: "Marketing",
  [TaskDepartment.PRODUCTION]: "Production",
};

const roleLabelMap: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.PM]: "Project Manager",
  [UserRole.SALES]: "Sales",
  [UserRole.TEAM]: "Team",
  [UserRole.MARKETING]: "Marketing",
  [UserRole.ACCOUNTANT]: "Accountant",
  [UserRole.CLIENT]: "Client",
};

const fixtureSalaryMap: Record<string, number> = {
  "emp-mona-saleh": 7800,
  "emp-omar-nasser": 6900,
  "emp-lina-haddad": 5200,
  "emp-fahad-ali": 6400,
};

const fixtureStartDateMap: Record<string, string> = {
  "emp-mona-saleh": "2024-02-15",
  "emp-omar-nasser": "2024-06-03",
  "emp-lina-haddad": "2025-01-11",
  "emp-fahad-ali": "2023-09-18",
};

const fixturePhoneMap: Record<string, string> = {
  "emp-mona-saleh": "+966500000121",
  "emp-omar-nasser": "+966500000122",
  "emp-lina-haddad": "+966500000123",
  "emp-fahad-ali": "+966500000124",
};

function deriveDepartment(role: UserRole, department: string): TaskDepartment | undefined {
  if (role !== UserRole.TEAM) {
    return undefined;
  }

  const normalized = department.trim().toUpperCase();

  if (normalized === "DESIGN") {
    return TaskDepartment.DESIGN;
  }

  if (normalized === "CONTENT") {
    return TaskDepartment.CONTENT;
  }

  if (normalized === "DEVELOPMENT") {
    return TaskDepartment.DEVELOPMENT;
  }

  if (normalized === "MARKETING") {
    return TaskDepartment.MARKETING;
  }

  if (normalized === "PRODUCTION") {
    return TaskDepartment.PRODUCTION;
  }

  return undefined;
}

export function createInitialEmployeeAdminRecords(): EmployeeAdminRecord[] {
  return employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    initials: employee.initials,
    email: employee.email,
    role: employee.role,
    department: deriveDepartment(employee.role, employee.department),
    phoneWhatsapp: fixturePhoneMap[employee.id] ?? "",
    salary: fixtureSalaryMap[employee.id] ?? 5000,
    startDate: fixtureStartDateMap[employee.id] ?? "2025-01-01",
    lastSeen: employee.lastActivity,
    isActive: employee.stateLabel === "Active",
  }));
}

export function getInitialEmployeeAdminRecordById(employeeId: string) {
  return createInitialEmployeeAdminRecords().find((employee) => employee.id === employeeId);
}

export function getRoleLabel(role: UserRole) {
  return roleLabelMap[role];
}

export function getDepartmentLabel(department?: TaskDepartment) {
  return department ? departmentLabelMap[department] : "—";
}

export function formatEmployeeSalary(salary: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(salary);
}

export function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export type EmployeeFormValues = {
  name: string;
  email: string;
  password: string;
  role: EmployeeAssignableRole;
  department?: TaskDepartment;
  phoneWhatsapp: string;
  salary: number;
  startDate: string;
  isActive: boolean;
};

const employeeFormBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z.string(),
  role: z.enum(employeeRoleOptions),
  department: z.enum(departmentOptions).optional(),
  phoneWhatsapp: z
    .string()
    .trim()
    .min(5, "Phone must be at least 5 characters.")
    .or(z.literal("")),
  salary: z.number().min(1, "Salary must be greater than 0."),
  startDate: z.string().min(1, "Start date is required."),
  isActive: z.boolean(),
});

export function buildEmployeeFormSchema(mode: "create" | "edit") {
  return employeeFormBaseSchema.superRefine((values, ctx) => {
    if (mode === "create" && values.password.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters.",
        path: ["password"],
      });
    }

    if (mode === "edit" && values.password.trim().length > 0 && values.password.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters.",
        path: ["password"],
      });
    }

    if (values.role === UserRole.TEAM && !values.department) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is required for team employees.",
        path: ["department"],
      });
    }
  });
}

export function getEmployeeFormDefaults(
  employee?: EmployeeAdminRecord
): EmployeeFormValues {
  return {
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    password: "",
    role: (employee?.role as EmployeeAssignableRole | undefined) ?? UserRole.TEAM,
    department: employee?.department,
    phoneWhatsapp: employee?.phoneWhatsapp ?? "",
    salary: employee?.salary ?? 4500,
    startDate: employee?.startDate ?? "2026-08-08",
    isActive: employee?.isActive ?? true,
  };
}

export function toEmployeeAdminRecord(
  values: EmployeeFormValues,
  existing?: EmployeeAdminRecord
): EmployeeAdminRecord {
  const department =
    values.role === UserRole.TEAM ? values.department : undefined;

  return {
    id: existing?.id ?? `emp-${values.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: values.name.trim(),
    initials: buildInitials(values.name),
    email: values.email.trim(),
    role: values.role,
    department,
    phoneWhatsapp: values.phoneWhatsapp.trim(),
    salary: values.salary,
    startDate: values.startDate,
    lastSeen: existing?.lastSeen ?? "Just now",
    isActive: values.isActive,
  };
}
