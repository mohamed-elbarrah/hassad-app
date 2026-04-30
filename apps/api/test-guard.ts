import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testGuard() {
  const user = await prisma.user.findUnique({
    where: { email: 'marketing@hassad.com' },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) return console.log('User not found');

  const rolePermissions = user.role.permissions.map(rp => rp.permission.name);
  const directPermissions = user.permissions.map(up => up.permission.name);
  const allPermissions = new Set([...rolePermissions, ...directPermissions]);

  const requiredPermissions = ['marketing.read'];
  
  console.log('Required:', requiredPermissions);
  console.log('Has:', Array.from(allPermissions));

  const hasPermission = requiredPermissions.every(permission => allPermissions.has(permission));
  console.log('hasPermission:', hasPermission);
}

testGuard().finally(() => prisma.$disconnect());
