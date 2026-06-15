import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const client of clients) {
    const existing = await prisma.clientProfile.findUnique({
      where: { clientId: client.id },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.clientProfile.create({
      data: { clientId: client.id },
    });
    created++;
    console.log(`Created profile for client ${client.id}`);
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
