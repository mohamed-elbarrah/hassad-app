import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "marketing@hassad.com" },
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
    },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log(`User: ${user.name} (${user.email})`);
  console.log(`Role: ${user.role.name}`);
  console.log("Permissions:");
  user.role.permissions.forEach((p) => {
    console.log(`- ${p.permission.name}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
