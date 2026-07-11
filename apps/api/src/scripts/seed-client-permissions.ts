import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENT_PERMISSIONS = [
  "clients.read",
  "clients.create",
  "clients.update",
  "clients.read_activity",
  "clients.handover",
];

const ROLE_ASSIGNMENTS: Record<string, string[]> = {
  ADMIN: CLIENT_PERMISSIONS,
  SALES: [
    "clients.read",
    "clients.create",
    "clients.update",
    "clients.read_activity",
  ],
  PM: ["clients.read"],
  CLIENT: ["clients.read"],
};

async function main() {
  // Upsert permissions
  for (const name of CLIENT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`Permission ensured: ${name}`);
  }

  // Fetch permission IDs
  const permissions = await prisma.permission.findMany({
    where: { name: { in: CLIENT_PERMISSIONS } },
  });
  const permissionByName = new Map(permissions.map((p) => [p.name, p.id]));

  // Assign to roles
  for (const [roleName, permissionNames] of Object.entries(ROLE_ASSIGNMENTS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role not found: ${roleName}`);
      continue;
    }

    for (const permissionName of permissionNames) {
      const permissionId = permissionByName.get(permissionName);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
      console.log(`Assigned ${permissionName} to ${roleName}`);
    }
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
