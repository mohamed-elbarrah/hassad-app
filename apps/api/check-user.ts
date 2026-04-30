import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'marketing@hassad.com' }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  const names = user.role.permissions.map(p => p.permission.name);
  console.log('User role permissions:', names);
}
main().finally(() => prisma.$disconnect());
