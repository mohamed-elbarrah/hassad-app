import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const perms = await prisma.permission.findMany({
    where: { name: { contains: "clients" } },
  });
  console.log("Permissions matching clients:");
  for (const p of perms) console.log(p.id, p.name);

  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
  });
  console.log("\nRole permissions:");
  for (const r of roles) {
    console.log(`Role ${r.name}:`);
    for (const rp of r.permissions) console.log("  ", rp.permission.name);
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
