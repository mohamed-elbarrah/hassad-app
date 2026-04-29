import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pmRole = await prisma.role.findUnique({ where: { name: "PM" } });

  if (!pmRole) {
    throw new Error("PM role not found");
  }

  const permission = await prisma.permission.upsert({
    where: { name: "tasks.create" },
    update: {},
    create: { name: "tasks.create" },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: pmRole.id,
        permissionId: permission.id,
      },
    },
    update: {},
    create: {
      roleId: pmRole.id,
      permissionId: permission.id,
    },
  });

  console.log("Patched PM role with tasks.create permission.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
