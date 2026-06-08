const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    name
  );
  return rows.length > 0;
}

async function main() {
  if (await tableExists("RequestDraft")) {
    console.log("RequestDraft table already exists");
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "RequestDraft" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "requestType" TEXT NOT NULL,
      "requesterId" TEXT NOT NULL,
      "productName" TEXT,
      "postPlatform" TEXT,
      "style" TEXT,
      "angle" TEXT,
      "hook" TEXT,
      "domainLpUrl" TEXT,
      "referenceLinks" TEXT,
      "rawOrReferenceLinks" TEXT,
      "videoAmount" INTEGER NOT NULL DEFAULT 0,
      "imageAmount" INTEGER NOT NULL DEFAULT 0,
      "useFrame" TEXT,
      "deadlineAt" DATETIME,
      "additionalNotes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "RequestDraft_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe('CREATE INDEX "RequestDraft_requestType_idx" ON "RequestDraft"("requestType")');
  await prisma.$executeRawUnsafe('CREATE INDEX "RequestDraft_requesterId_idx" ON "RequestDraft"("requesterId")');
  await prisma.$executeRawUnsafe('CREATE INDEX "RequestDraft_updatedAt_idx" ON "RequestDraft"("updatedAt")');

  console.log("Added RequestDraft table");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
