const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function normalizeProductName(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function productSlug(value) {
  return normalizeProductName(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  const advertiser = await prisma.user.findUnique({ where: { username: "andi" } });
  const cc = await prisma.user.findUnique({ where: { username: "budi" } });
  await assert(admin && advertiser && cc, "Seed accounts are missing.");

  const smokeProduct = await prisma.product.upsert({
    where: { normalizedName: normalizeProductName("Smoke Test Produk") },
    update: { name: "Smoke Test Produk" },
    create: {
      name: "Smoke Test Produk",
      normalizedName: normalizeProductName("Smoke Test Produk")
    }
  });

  const request = await prisma.workRequest.create({
    data: {
      requestType: "CONTENT",
      productName: smokeProduct.name,
      productKey: productSlug(smokeProduct.name),
      productId: smokeProduct.id,
      requesterId: advertiser.id,
      title: "Konten - Smoke Test Produk",
      postPlatform: "META",
      videoAmount: 1,
      imageAmount: 1,
      useFrame: "BEBAS_CREATOR",
      deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "BELUM"
    }
  });

  await prisma.workRequest.update({
    where: { id: request.id },
    data: {
      status: "DIKERJAKAN",
      creatorId: cc.id,
      startedAt: new Date()
    }
  });
  const log = await prisma.workTimeLog.create({
    data: {
      requestId: request.id,
      creatorId: cc.id,
      logType: "INITIAL_WORK",
      startedAt: new Date(Date.now() - 20 * 60 * 1000)
    }
  });

  const submission = await prisma.workSubmission.create({
    data: {
      requestId: request.id,
      creatorId: cc.id,
      submissionType: "INITIAL",
      mainLink: "https://drive.google.com/smoke-video",
      submittedVideoAmount: 1,
      submittedImageAmount: 1,
      version: 1
    }
  });
  await prisma.submissionAsset.createMany({
    data: [
      {
        submissionId: submission.id,
        requestId: request.id,
        assetKind: "VIDEO",
        title: "Smoke Test Produk - Video 1",
        link: "https://drive.google.com/smoke-video",
        sortOrder: 0
      },
      {
        submissionId: submission.id,
        requestId: request.id,
        assetKind: "IMAGE",
        title: "Smoke Test Produk - Gambar 1",
        link: "https://drive.google.com/smoke-image",
        sortOrder: 1
      }
    ]
  });
  await prisma.workTimeLog.update({
    where: { id: log.id },
    data: {
      endedAt: new Date(),
      durationSeconds: 1200
    }
  });
  await prisma.workRequest.update({
    where: { id: request.id },
    data: { status: "SUDAH" }
  });

  await prisma.reviewLog.create({
    data: {
      requestId: request.id,
      reviewerId: advertiser.id,
      decision: "REVISION_REQUESTED",
      reviewNote: "Smoke revision"
    }
  });
  await prisma.workRequest.update({
    where: { id: request.id },
    data: { status: "REVISI" }
  });
  await prisma.reviewLog.create({
    data: {
      requestId: request.id,
      reviewerId: cc.id,
      decision: "REVISION_RETURNED_BY_CC",
      reviewNote: "Need clearer revision"
    }
  });
  await prisma.workRequest.update({
    where: { id: request.id },
    data: { status: "REVISI_DIKEMBALIKAN" }
  });
  await prisma.reviewLog.create({
    data: {
      requestId: request.id,
      reviewerId: advertiser.id,
      decision: "CLARIFICATION",
      reviewNote: "Focus on first 3 seconds"
    }
  });
  await prisma.workRequest.update({
    where: { id: request.id },
    data: { status: "REVISI" }
  });

  await prisma.workRequest.update({
    where: { id: request.id },
    data: { status: "SUDAH" }
  });
  const latestAssets = await prisma.submissionAsset.findMany({
    where: { submissionId: submission.id },
    orderBy: { sortOrder: "asc" }
  });
  for (const asset of latestAssets) {
    await prisma.contentBank.create({
      data: {
        requestId: request.id,
        productId: smokeProduct.id,
        productName: smokeProduct.name,
        productKey: productSlug(smokeProduct.name),
        title: asset.title,
        assetType: "CONTENT",
        assetKind: asset.assetKind,
        platform: "META",
        requestedVideoAmount: request.videoAmount,
        requestedImageAmount: request.imageAmount,
        submittedVideoAmount: asset.assetKind === "VIDEO" ? 1 : 0,
        submittedImageAmount: asset.assetKind === "IMAGE" ? 1 : 0,
        mainLink: asset.link,
        creatorId: cc.id,
        requesterId: advertiser.id,
        testStatus: "READY_TEST"
      }
    });
  }
  await prisma.reviewLog.create({
    data: {
      requestId: request.id,
      reviewerId: advertiser.id,
      decision: "ACC",
      reviewNote: "Smoke ACC"
    }
  });
  await prisma.workRequest.update({
    where: { id: request.id },
    data: { status: "BERES" }
  });

  const bankCount = await prisma.contentBank.count({ where: { requestId: request.id } });
  await assert(bankCount === 2, "ACC should create one bank item per submitted asset.");

  const videoBank = await prisma.contentBank.findFirst({
    where: { requestId: request.id, assetKind: "VIDEO" }
  });
  await prisma.assetFeedback.create({
    data: {
      contentBankId: videoBank.id,
      reviewerId: advertiser.id,
      testStatus: "WINNER",
      testedPlatform: "META",
      totalScore: 24,
      score1: 5,
      score2: 5,
      score3: 5,
      score4: 5,
      score5: 4,
      feedbackNote: "Smoke winner"
    }
  });
  await prisma.contentBank.update({
    where: { id: videoBank.id },
    data: {
      testStatus: "WINNER",
      scoreTotal: 24,
      feedbackCount: { increment: 1 }
    }
  });

  const winnerCount = await prisma.contentBank.count({
    where: { requestId: request.id, testStatus: "WINNER" }
  });
  await assert(winnerCount === 1, "Asset-level status update failed.");

  console.log("Smoke test passed");
  console.log(`Created request ${request.id} with ${bankCount} bank assets`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
