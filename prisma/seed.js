const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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

function links(items) {
  return JSON.stringify(items);
}

function addHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function subHours(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.assetFeedback.deleteMany();
  await prisma.contentBank.deleteMany();
  await prisma.reviewLog.deleteMany();
  await prisma.taskNote.deleteMany();
  await prisma.submissionAsset.deleteMany();
  await prisma.workSubmission.deleteMany();
  await prisma.workTimeLog.deleteMany();
  await prisma.workRequest.deleteMany();
  await prisma.creatorStatusLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const [adminPass, advertiserPass, ccPass] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("advertiser123", 10),
    bcrypt.hash("cc123", 10)
  ]);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPass,
      displayName: "Admin Al-Fath",
      whatsappNumber: "6281234567890",
      role: "ADMIN"
    }
  });
  const andi = await prisma.user.create({
    data: {
      username: "andi",
      passwordHash: advertiserPass,
      displayName: "Andi Pengiklan",
      whatsappNumber: "628111222333",
      role: "ADVERTISER"
    }
  });
  const budi = await prisma.user.create({
    data: {
      username: "budi",
      passwordHash: ccPass,
      displayName: "Budi Creator",
      whatsappNumber: "628222333444",
      role: "CC"
    }
  });
  const citra = await prisma.user.create({
    data: {
      username: "citra",
      passwordHash: ccPass,
      displayName: "Citra Creator",
      whatsappNumber: "628333444555",
      role: "CC"
    }
  });

  const salep = await prisma.product.create({
    data: {
      name: "Salep Varises",
      normalizedName: normalizeProductName("Salep Varises"),
      category: "Kesehatan",
      niche: "Varises",
      notes: "Produk evergreen untuk angle nyeri kaki, aktivitas harian, dan testimoni."
    }
  });
  const kopi = await prisma.product.create({
    data: {
      name: "Kopi Stamina",
      normalizedName: normalizeProductName("Kopi Stamina"),
      category: "Minuman",
      niche: "Stamina pria",
      notes: "Perlu angle compliance dan visual softselling."
    }
  });
  const skincare = await prisma.product.create({
    data: {
      name: "Skincare Glow",
      normalizedName: normalizeProductName("Skincare Glow"),
      category: "Beauty",
      niche: "Wajah kusam"
    }
  });

  await prisma.appSetting.createMany({
    data: [
      { key: "admin_whatsapp_number", value: "6289635998869" },
      { key: "session_days", value: "30" }
    ]
  });

  const completedContent = await prisma.workRequest.create({
    data: {
      requestType: "CONTENT",
      productName: salep.name,
      productKey: productSlug(salep.name),
      productId: salep.id,
      requesterId: andi.id,
      creatorId: budi.id,
      title: "Konten - Salep Varises",
      postPlatform: "META",
      videoAmount: 3,
      imageAmount: 2,
      useFrame: "BEBAS_CREATOR",
      rawOrReferenceLinks: links(["https://drive.google.com/salep-raw", "https://tiktok.com/@referensi/salep"]),
      angle: "Aktif bergerak tanpa kaki terasa berat",
      hook: "Kaki sering pegal setelah berdiri lama?",
      deadlineAt: subHours(4),
      additionalNotes: "Buat beberapa variasi hook, boleh lebih dari jumlah request.",
      status: "BERES",
      startedAt: subHours(26)
    }
  });

  await prisma.workTimeLog.create({
    data: {
      requestId: completedContent.id,
      creatorId: budi.id,
      logType: "INITIAL_WORK",
      startedAt: subHours(26),
      endedAt: subHours(20),
      durationSeconds: 21600,
      note: "Selesai dengan tambahan variasi gambar."
    }
  });

  const completedSubmission = await prisma.workSubmission.create({
    data: {
      requestId: completedContent.id,
      creatorId: budi.id,
      submissionType: "INITIAL",
      mainLink: "https://drive.google.com/salep-video-1",
      additionalLinks: links(["https://drive.google.com/salep-folder-final"]),
      submittedVideoAmount: 4,
      submittedImageAmount: 3,
      note: "Saya submit ekstra 1 video dan 1 gambar.",
      version: 1
    }
  });

  const salepAssets = [
    ["VIDEO", "Salep Varises - Video 1", "https://drive.google.com/salep-video-1", "WINNER", 23],
    ["VIDEO", "Salep Varises - Video 2", "https://drive.google.com/salep-video-2", "LOSER", null],
    ["VIDEO", "Salep Varises - Video 3", "https://drive.google.com/salep-video-3", "READY_TEST", null],
    ["VIDEO", "Salep Varises - Video 4", "https://drive.google.com/salep-video-4", "BIASA", 17],
    ["IMAGE", "Salep Varises - Gambar 1", "https://drive.google.com/salep-image-1", "READY_TEST", null],
    ["IMAGE", "Salep Varises - Gambar 2", "https://drive.google.com/salep-image-2", "ARCHIVED", null],
    ["IMAGE", "Salep Varises - Gambar 3", "https://drive.google.com/salep-image-3", "BIASA", null]
  ];

  for (const [index, asset] of salepAssets.entries()) {
    await prisma.submissionAsset.create({
      data: {
        submissionId: completedSubmission.id,
        requestId: completedContent.id,
        assetKind: asset[0],
        title: asset[1],
        link: asset[2],
        sortOrder: index
      }
    });
    const bankItem = await prisma.contentBank.create({
      data: {
        requestId: completedContent.id,
        productId: salep.id,
        productName: salep.name,
        productKey: productSlug(salep.name),
        title: asset[1],
        assetType: "CONTENT",
        assetKind: asset[0],
        platform: "META",
        style: null,
        angle: completedContent.angle,
        hook: completedContent.hook,
        requestedVideoAmount: completedContent.videoAmount,
        requestedImageAmount: completedContent.imageAmount,
        submittedVideoAmount: asset[0] === "VIDEO" ? 1 : 0,
        submittedImageAmount: asset[0] === "IMAGE" ? 1 : 0,
        mainLink: asset[2],
        additionalLinks: completedSubmission.additionalLinks,
        creatorId: budi.id,
        requesterId: andi.id,
        testStatus: asset[3],
        scoreTotal: asset[4],
        feedbackCount: asset[4] ? 1 : 0
      }
    });
    if (asset[4]) {
      await prisma.assetFeedback.create({
        data: {
          contentBankId: bankItem.id,
          reviewerId: andi.id,
          testStatus: asset[3],
          testedPlatform: "META",
          testDate: subHours(10),
          testResult: asset[3] === "WINNER" ? "Bagus" : "Biasa",
          score1: 5,
          score2: 4,
          score3: 5,
          score4: 4,
          score5: asset[4] - 18,
          totalScore: asset[4],
          spend: 750000,
          roas: asset[3] === "WINNER" ? 2.6 : 1.1,
          feedbackNote: asset[3] === "WINNER" ? "Hook kuat, visual produk jelas." : "Perlu visual problem lebih cepat.",
          suggestionForCreator: "Pertahankan struktur hook, perbanyak variasi opening."
        }
      });
    }
  }

  const completedLp = await prisma.workRequest.create({
    data: {
      requestType: "LP",
      productName: salep.name,
      productKey: productSlug(salep.name),
      productId: salep.id,
      requesterId: andi.id,
      creatorId: citra.id,
      title: "LP - Salep Varises",
      postPlatform: "WEBSITE",
      style: "HARDSELLING",
      angle: "Masalah kaki pegal dan tampilan varises",
      domainLpUrl: "https://alfath.example/salep-varises",
      referenceLinks: links(["https://example.com/lp-referensi-salep"]),
      deadlineAt: subHours(18),
      status: "BERES",
      startedAt: subHours(36)
    }
  });
  await prisma.workTimeLog.create({
    data: {
      requestId: completedLp.id,
      creatorId: citra.id,
      logType: "INITIAL_WORK",
      startedAt: subHours(36),
      endedAt: subHours(28),
      durationSeconds: 28800
    }
  });
  const lpSubmission = await prisma.workSubmission.create({
    data: {
      requestId: completedLp.id,
      creatorId: citra.id,
      submissionType: "INITIAL",
      mainLink: "https://alfath.example/salep-varises-final",
      submittedVideoAmount: 0,
      submittedImageAmount: 0,
      version: 1
    }
  });
  await prisma.submissionAsset.create({
    data: {
      submissionId: lpSubmission.id,
      requestId: completedLp.id,
      assetKind: "LP",
      title: "LP Salep Varises - Hardselling",
      link: "https://alfath.example/salep-varises-final"
    }
  });
  await prisma.contentBank.create({
    data: {
      requestId: completedLp.id,
      productId: salep.id,
      productName: salep.name,
      productKey: productSlug(salep.name),
      title: "LP Salep Varises - Hardselling",
      assetType: "LP",
      assetKind: "LP",
      platform: "WEBSITE",
      style: "HARDSELLING",
      angle: completedLp.angle,
      requestedVideoAmount: 0,
      requestedImageAmount: 0,
      submittedVideoAmount: 0,
      submittedImageAmount: 0,
      mainLink: "https://alfath.example/salep-varises-final",
      creatorId: citra.id,
      requesterId: andi.id,
      testStatus: "READY_TEST"
    }
  });

  const reviewTask = await prisma.workRequest.create({
    data: {
      requestType: "CONTENT",
      productName: kopi.name,
      productKey: productSlug(kopi.name),
      productId: kopi.id,
      requesterId: andi.id,
      creatorId: budi.id,
      title: "Konten - Kopi Stamina",
      postPlatform: "TIKTOK",
      videoAmount: 2,
      imageAmount: 0,
      useFrame: "TIDAK",
      rawOrReferenceLinks: links(["https://drive.google.com/kopi-raw"]),
      angle: "Energi pagi untuk aktivitas padat",
      deadlineAt: addHours(6),
      status: "SUDAH",
      startedAt: subHours(8)
    }
  });
  await prisma.workTimeLog.create({
    data: {
      requestId: reviewTask.id,
      creatorId: budi.id,
      logType: "INITIAL_WORK",
      startedAt: subHours(8),
      endedAt: subHours(3),
      durationSeconds: 18000
    }
  });
  const reviewSubmission = await prisma.workSubmission.create({
    data: {
      requestId: reviewTask.id,
      creatorId: budi.id,
      submissionType: "INITIAL",
      mainLink: "https://drive.google.com/kopi-video-1",
      submittedVideoAmount: 2,
      submittedImageAmount: 0,
      note: "Versi TikTok dibuat softselling.",
      version: 1
    }
  });
  await prisma.submissionAsset.createMany({
    data: [
      {
        submissionId: reviewSubmission.id,
        requestId: reviewTask.id,
        assetKind: "VIDEO",
        title: "Kopi Stamina - Video 1",
        link: "https://drive.google.com/kopi-video-1",
        sortOrder: 0
      },
      {
        submissionId: reviewSubmission.id,
        requestId: reviewTask.id,
        assetKind: "VIDEO",
        title: "Kopi Stamina - Video 2",
        link: "https://drive.google.com/kopi-video-2",
        sortOrder: 1
      }
    ]
  });

  await prisma.workRequest.create({
    data: {
      requestType: "CONTENT",
      productName: skincare.name,
      productKey: productSlug(skincare.name),
      productId: skincare.id,
      requesterId: andi.id,
      title: "Konten - Skincare Glow",
      postPlatform: "META",
      videoAmount: 1,
      imageAmount: 2,
      useFrame: "YA",
      rawOrReferenceLinks: links(["https://drive.google.com/skincare-ref"]),
      angle: "Wajah kusam sebelum meeting",
      hook: "Kulit terlihat capek padahal tidur cukup?",
      deadlineAt: addHours(30),
      status: "BELUM"
    }
  });

  const revisionTask = await prisma.workRequest.create({
    data: {
      requestType: "LP",
      productName: kopi.name,
      productKey: productSlug(kopi.name),
      productId: kopi.id,
      requesterId: andi.id,
      creatorId: citra.id,
      title: "LP - Kopi Stamina",
      postPlatform: "WEBSITE",
      style: "SOFTSELLING",
      angle: "Rutinitas pagi yang produktif",
      domainLpUrl: "https://alfath.example/kopi-stamina",
      deadlineAt: addHours(12),
      status: "REVISI"
    }
  });
  await prisma.reviewLog.create({
    data: {
      requestId: revisionTask.id,
      reviewerId: andi.id,
      decision: "REVISION_REQUESTED",
      reviewNote: "CTA kurang jelas, tambahkan section testimoni."
    }
  });

  const returnedTask = await prisma.workRequest.create({
    data: {
      requestType: "CONTENT",
      productName: salep.name,
      productKey: productSlug(salep.name),
      productId: salep.id,
      requesterId: andi.id,
      creatorId: budi.id,
      title: "Konten Revisi - Salep Varises",
      postPlatform: "META",
      videoAmount: 1,
      imageAmount: 0,
      useFrame: "BEBAS_CREATOR",
      deadlineAt: addHours(4),
      status: "REVISI_DIKEMBALIKAN"
    }
  });
  await prisma.reviewLog.createMany({
    data: [
      {
        requestId: returnedTask.id,
        reviewerId: andi.id,
        decision: "REVISION_REQUESTED",
        reviewNote: "Ubah opening agar lebih emosional."
      },
      {
        requestId: returnedTask.id,
        reviewerId: budi.id,
        decision: "REVISION_RETURNED_BY_CC",
        reviewNote: "Revisi belum jelas: emosional seperti testimoni atau problem agitation?"
      }
    ]
  });
  await prisma.taskNote.create({
    data: {
      requestId: returnedTask.id,
      userId: budi.id,
      noteType: "REVISION_RETURN",
      note: "Butuh klarifikasi arah emosional sebelum dikerjakan."
    }
  });

  await prisma.creatorStatusLog.create({
    data: {
      userId: citra.id,
      status: "OFF",
      reason: "PROJECT_LUAR",
      note: "Kembali sore ini.",
      startedAt: subHours(2),
      expectedUntil: addHours(3)
    }
  });

  console.log("Seed complete");
  console.log("Accounts: admin/admin123, andi/advertiser123, budi/cc123, citra/cc123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
