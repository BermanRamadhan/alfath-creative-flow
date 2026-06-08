const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("User")');
  const hasColumn = columns.some((column) => column.name === "whatsappNumber");
  if (!hasColumn) {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "whatsappNumber" TEXT');
  }

  await prisma.$executeRawUnsafe('UPDATE "User" SET "whatsappNumber" = ? WHERE "username" = ? AND "whatsappNumber" IS NULL', "6281234567890", "admin");
  await prisma.$executeRawUnsafe('UPDATE "User" SET "whatsappNumber" = ? WHERE "username" = ? AND "whatsappNumber" IS NULL', "628111222333", "andi");
  await prisma.$executeRawUnsafe('UPDATE "User" SET "whatsappNumber" = ? WHERE "username" = ? AND "whatsappNumber" IS NULL', "628222333444", "budi");
  await prisma.$executeRawUnsafe('UPDATE "User" SET "whatsappNumber" = ? WHERE "username" = ? AND "whatsappNumber" IS NULL', "628333444555", "citra");

  console.log(hasColumn ? "User.whatsappNumber already exists" : "Added User.whatsappNumber");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
