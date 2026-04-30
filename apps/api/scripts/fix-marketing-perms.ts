import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.findUnique({
    where: { name: 'MARKETING' },
    include: { permissions: true },
  });

  if (!role) {
    console.log('Role MARKETING not found');
    return;
  }

  const extraPerms = await prisma.permission.findMany({
    where: { name: { in: ['projects.read', 'tasks.read', 'tasks.update', 'tasks.comment'] } },
  });

  const allPerms = [
    ...(await prisma.permission.findMany({ where: { name: { startsWith: 'marketing.' } } })),
    ...extraPerms,
  ];

  console.log(`Found ${allPerms.length} marketing permissions`);

  for (const perm of allPerms) {
    const exists = role.permissions.find(p => p.permissionId === perm.id);
    if (!exists) {
      console.log(`Adding permission ${perm.name} to MARKETING role`);
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    } else {
      console.log(`Permission ${perm.name} already exists for MARKETING role`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
