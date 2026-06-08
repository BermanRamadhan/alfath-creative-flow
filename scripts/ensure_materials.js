const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function externalHref(value) {
  const link = String(value ?? "").trim();
  if (!link) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:|tg:)/i.test(link)) return link;
  if (link.startsWith("//")) return `https:${link}`;
  return `https://${link.replace(/^\/+/, "")}`;
}

function parseLinks(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(externalHref).filter(Boolean);
  } catch {}
  return String(value)
    .split(/\r?\n|,/)
    .map(externalHref)
    .filter(Boolean);
}

function materialTypeFromLink(link, fallback) {
  const lower = link.toLowerCase();
  if (lower.includes("json") || lower.endsWith(".json")) return "JSON_TEMPLATE";
  if (lower.includes("tiktok") || lower.includes("youtube") || lower.includes("instagram") || lower.includes("referensi") || lower.includes("reference") || lower.includes("ref")) {
    return "REFERENSI";
  }
  return fallback;
}

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MaterialReference" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "materialType" TEXT NOT NULL,
      "sourceType" TEXT NOT NULL,
      "productId" TEXT,
      "productName" TEXT NOT NULL,
      "productKey" TEXT NOT NULL,
      "requestId" TEXT,
      "submissionId" TEXT,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "platform" TEXT,
      "note" TEXT,
      "requesterId" TEXT,
      "creatorId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MaterialReference_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "MaterialReference_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MaterialReference_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "MaterialReference_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "MaterialReference_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);
  for (const statement of [
    'CREATE INDEX IF NOT EXISTS "MaterialReference_materialType_idx" ON "MaterialReference"("materialType");',
    'CREATE INDEX IF NOT EXISTS "MaterialReference_sourceType_idx" ON "MaterialReference"("sourceType");',
    'CREATE INDEX IF NOT EXISTS "MaterialReference_productKey_idx" ON "MaterialReference"("productKey");',
    'CREATE INDEX IF NOT EXISTS "MaterialReference_requestId_idx" ON "MaterialReference"("requestId");',
    'CREATE INDEX IF NOT EXISTS "MaterialReference_submissionId_idx" ON "MaterialReference"("submissionId");',
    'CREATE INDEX IF NOT EXISTS "MaterialReference_requesterId_idx" ON "MaterialReference"("requesterId");',
    'CREATE INDEX IF NOT EXISTS "MaterialReference_creatorId_idx" ON "MaterialReference"("creatorId");'
  ]) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function main() {
  await ensureTable();
  await prisma.materialReference.deleteMany({
    where: {
      sourceType: { in: ["REQUEST", "SUBMISSION"] }
    }
  });

  const requests = await prisma.workRequest.findMany();
  const materialData = [];
  for (const request of requests) {
    const links = request.requestType === "LP" ? parseLinks(request.referenceLinks) : parseLinks(request.rawOrReferenceLinks);
    links.forEach((url, index) => {
      const fallback = request.requestType === "LP" ? "REFERENSI" : "MENTAHAN";
      materialData.push({
        materialType: materialTypeFromLink(url, fallback),
        sourceType: "REQUEST",
        productId: request.productId,
        productName: request.productName,
        productKey: request.productKey,
        requestId: request.id,
        title: `${request.productName} - ${request.requestType === "LP" ? "Referensi LP" : "Bahan Konten"} ${index + 1}`,
        url,
        platform: request.postPlatform,
        note: request.title,
        requesterId: request.requesterId,
        creatorId: request.creatorId
      });
    });
  }

  const submissions = await prisma.workSubmission.findMany({
    include: { request: true }
  });
  for (const submission of submissions) {
    parseLinks(submission.additionalLinks).forEach((url, index) => {
      materialData.push({
        materialType: materialTypeFromLink(url, "MENTAHAN"),
        sourceType: "SUBMISSION",
        productId: submission.request.productId,
        productName: submission.request.productName,
        productKey: submission.request.productKey,
        requestId: submission.requestId,
        submissionId: submission.id,
        title: `${submission.request.productName} - Bundle Submission ${index + 1}`,
        url,
        platform: submission.request.postPlatform,
        note: submission.note,
        requesterId: submission.request.requesterId,
        creatorId: submission.creatorId
      });
    });
  }

  if (materialData.length) {
    await prisma.materialReference.createMany({ data: materialData });
  }

  console.log(`Material references ready: ${materialData.length} automated links`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
