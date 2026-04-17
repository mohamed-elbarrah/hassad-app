import { PrismaClient, UserRole, TaskDepartment } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const users: Array<{
    email: string;
    name: string;
    role: UserRole;
    department?: TaskDepartment;
  }> = [
    { email: "admin@hassad.com", name: "Super Admin", role: UserRole.ADMIN },
    {
      email: "pm@hassad.com",
      name: "Project Manager",
      role: UserRole.PM,
      department: TaskDepartment.MANAGEMENT,
    },
    { email: "sales@hassad.com", name: "Sales Agent", role: UserRole.SALES },
    {
      email: "employee@hassad.com",
      name: "Employee User",
      role: UserRole.EMPLOYEE,
      department: TaskDepartment.DESIGN,
    },
    {
      email: "marketing@hassad.com",
      name: "Marketing Manager",
      role: UserRole.MARKETING,
      department: TaskDepartment.MARKETING,
    },
    {
      email: "accountant@hassad.com",
      name: "Accountant",
      role: UserRole.ACCOUNTANT,
    },
    { email: "client@hassad.com", name: "Test Client", role: UserRole.CLIENT },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { department: user.department ?? null },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        passwordHash,
      },
    });
  }

  console.log("Database seeded with standard users (password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
