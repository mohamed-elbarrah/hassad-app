import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Roles
  const roles = [
    'ADMIN',
    'PM',
    'SALES',
    'EMPLOYEE',
    'MARKETING',
    'ACCOUNTANT',
    'CLIENT',
  ];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  // 2. Seed Departments
  const departments = [
    'MANAGEMENT',
    'DESIGN',
    'CONTENT',
    'DEVELOPMENT',
    'MARKETING',
    'PRODUCTION',
  ];

  for (const deptName of departments) {
    await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: { name: deptName },
    });
  }

  // 3. Seed Users
  const users = [
    { email: "admin@hassad.com", name: "Super Admin", role: "ADMIN" },
    { email: "pm@hassad.com", name: "Project Manager", role: "PM", dept: "MANAGEMENT" },
    { email: "sales@hassad.com", name: "Sales Agent", role: "SALES" },
    { email: "employee@hassad.com", name: "Employee User", role: "EMPLOYEE", dept: "DESIGN" },
    { email: "marketing@hassad.com", name: "Marketing Manager", role: "MARKETING", dept: "MARKETING" },
    { email: "accountant@hassad.com", name: "Accountant", role: "ACCOUNTANT" },
    { email: "client@hassad.com", name: "Test Client", role: "CLIENT" },
  ];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: { connect: { name: user.role } },
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: { connect: { name: user.role } },
      },
    });

    if (user.dept) {
      const dept = await prisma.department.findUnique({ where: { name: user.dept } });
      if (dept) {
        await prisma.userDepartment.upsert({
          where: {
            userId_departmentId: {
              userId: createdUser.id,
              departmentId: dept.id,
            },
          },
          update: {},
          create: {
            userId: createdUser.id,
            departmentId: dept.id,
          },
        });
      }
    }
  }

  console.log("Database seeded with roles, departments, and standard users (password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
