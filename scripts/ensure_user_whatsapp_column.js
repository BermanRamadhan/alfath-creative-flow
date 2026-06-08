const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({ where: { username: "admin", whatsappNumber: null }, data: { whatsappNumber: "6281234567890" } });
  await prisma.user.updateMany({ where: { username: "andi", whatsappNumber: null }, data: { whatsappNumber: "628111222333" } });
  await prisma.user.updateMany({ where: { username: "budi", whatsappNumber: null }, data: { whatsappNumber: "628222333444" } });
  await prisma.user.updateMany({ where: { username: "citra", whatsappNumber: null }, data: { whatsappNumber: "628333444555" } });

  console.log("User.whatsappNumber values ensured");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
