import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employeeRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });

  if (!employeeRole) {
    throw new Error('EMPLOYEE role not found');
  }

  const permissionNames = ['notifications.read', 'notifications.update'];

  for (const permissionName of permissionNames) {
    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: { name: permissionName },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('Patched EMPLOYEE role notification permissions.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
