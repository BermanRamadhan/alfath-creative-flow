import { Prisma, PrismaClient } from "@prisma/client";
import {
  ASSET_KINDS,
  CONTENT_PLATFORMS,
  OFF_REASONS,
  PLATFORMS,
  STYLES,
  TEST_STATUSES,
  USE_FRAMES,
  isOneOf
} from "@/lib/constants";
import { db } from "@/lib/db";
import { externalHref, normalizeProductName, optionalString, productSlug, serializeLinks, titleCase } from "@/lib/utils";

type DbClient = PrismaClient | Prisma.TransactionClient;

type AssetInput = {
  kind: string;
  title: string;
  link: string;
  note?: string | null;
};

function assertValue<T extends readonly string[]>(value: string, allowed: T, label: string): T[number] {
  if (!isOneOf(value, allowed)) {
    throw new Error(`${label} tidak valid.`);
  }
  return value;
}

function assertDate(value: Date) {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Deadline tidak valid.");
  }
}

function cleanLinks(links: string[]) {
  return links.map((link) => externalHref(link)).filter((link) => link !== "#");
}

function materialTypeFromLink(link: string, fallback: string) {
  const lower = link.toLowerCase();
  if (lower.includes("json") || lower.endsWith(".json")) return "JSON_TEMPLATE";
  if (
    lower.includes("tiktok") ||
    lower.includes("youtube") ||
    lower.includes("instagram") ||
    lower.includes("referensi") ||
    lower.includes("reference") ||
    lower.includes("ref")
  ) {
    return "REFERENSI";
  }
  return fallback;
}

async function createMaterialReferences(
  client: DbClient,
  input: {
    links: string[];
    fallbackType: "MENTAHAN" | "REFERENSI";
    sourceType: "REQUEST" | "SUBMISSION";
    productId?: string | null;
    productName: string;
    productKey: string;
    requestId: string;
    submissionId?: string | null;
    titlePrefix: string;
    platform?: string | null;
    note?: string | null;
    requesterId?: string | null;
    creatorId?: string | null;
  }
) {
  const links = cleanLinks(input.links);
  if (!links.length) return;
  await client.materialReference.createMany({
    data: links.map((url, index) => ({
      materialType: materialTypeFromLink(url, input.fallbackType),
      sourceType: input.sourceType,
      productId: input.productId ?? null,
      productName: input.productName,
      productKey: input.productKey,
      requestId: input.requestId,
      submissionId: input.submissionId ?? null,
      title: `${input.titlePrefix} ${index + 1}`,
      url,
      platform: input.platform ?? null,
      note: input.note ?? null,
      requesterId: input.requesterId ?? null,
      creatorId: input.creatorId ?? null
    }))
  });
}

function assertPendingRequestPermission(
  userId: string,
  isAdmin: boolean,
  request: { requesterId: string; status: string }
) {
  if (!isAdmin && request.requesterId !== userId) {
    throw new Error("Kamu tidak punya akses ke request ini.");
  }
  if (request.status !== "BELUM") {
    throw new Error("Request hanya bisa diubah atau dihapus sebelum dikerjakan.");
  }
}

function cleanAssets(assets: AssetInput[]) {
  return assets
    .map((asset) => ({
      ...asset,
      title: asset.title.trim(),
      link: externalHref(asset.link),
      note: asset.note?.trim() || null
    }))
    .filter((asset) => asset.link && isOneOf(asset.kind, ASSET_KINDS));
}

export async function ensureProductByName(productName: string, client: DbClient = db) {
  const normalized = normalizeProductName(productName);
  if (!normalized) throw new Error("Nama produk wajib diisi.");
  const displayName = titleCase(normalized);

  return client.product.upsert({
    where: { normalizedName: normalized },
    update: {
      name: displayName
    },
    create: {
      name: displayName,
      normalizedName: normalized
    }
  });
}

export async function createLpRequest(
  requesterId: string,
  input: {
    productName: string;
    postPlatform: string;
    domainLpUrl: string;
    style: string;
    angle?: string | null;
    referenceLinks?: string[];
    deadlineAt: Date;
    additionalNotes?: string | null;
  }
) {
  const platform = assertValue(input.postPlatform, PLATFORMS, "Platform");
  const style = assertValue(input.style, STYLES, "Style");
  assertDate(input.deadlineAt);
  if (!input.domainLpUrl.trim()) throw new Error("Domain/link LP wajib diisi.");

  return db.$transaction(async (tx) => {
    const product = await ensureProductByName(input.productName, tx);
    const referenceLinks = cleanLinks(input.referenceLinks ?? []);
    const created = await tx.workRequest.create({
      data: {
        requestType: "LP",
        productName: product.name,
        productKey: productSlug(product.name),
        productId: product.id,
        requesterId,
        title: `LP - ${product.name}`,
        postPlatform: platform,
        style,
        angle: optionalString(input.angle ?? ""),
        domainLpUrl: externalHref(input.domainLpUrl),
        referenceLinks: serializeLinks(referenceLinks),
        deadlineAt: input.deadlineAt,
        additionalNotes: optionalString(input.additionalNotes ?? "")
      }
    });
    await createMaterialReferences(tx, {
      links: referenceLinks,
      fallbackType: "REFERENSI",
      sourceType: "REQUEST",
      productId: product.id,
      productName: product.name,
      productKey: productSlug(product.name),
      requestId: created.id,
      titlePrefix: `${product.name} - Referensi LP`,
      platform,
      note: created.title,
      requesterId
    });
    return created;
  });
}

export async function createContentRequest(
  requesterId: string,
  input: {
    productName: string;
    videoAmount: number;
    imageAmount: number;
    useFrame: string;
    postPlatform: string;
    rawOrReferenceLinks?: string[];
    angle?: string | null;
    hook?: string | null;
    deadlineAt: Date;
    additionalNotes?: string | null;
  }
) {
  const platform = assertValue(input.postPlatform, CONTENT_PLATFORMS, "Platform");
  const useFrame = assertValue(input.useFrame, USE_FRAMES, "Pakai frame");
  assertDate(input.deadlineAt);
  const videoAmount = Math.max(0, Math.floor(input.videoAmount || 0));
  const imageAmount = Math.max(0, Math.floor(input.imageAmount || 0));
  if (videoAmount + imageAmount < 1) {
    throw new Error("Jumlah video + gambar minimal 1.");
  }

  return db.$transaction(async (tx) => {
    const product = await ensureProductByName(input.productName, tx);
    const rawLinks = cleanLinks(input.rawOrReferenceLinks ?? []);
    const created = await tx.workRequest.create({
      data: {
        requestType: "CONTENT",
        productName: product.name,
        productKey: productSlug(product.name),
        productId: product.id,
        requesterId,
        title: `Konten - ${product.name}`,
        postPlatform: platform,
        videoAmount,
        imageAmount,
        useFrame,
        rawOrReferenceLinks: serializeLinks(rawLinks),
        angle: optionalString(input.angle ?? ""),
        hook: optionalString(input.hook ?? ""),
        deadlineAt: input.deadlineAt,
        additionalNotes: optionalString(input.additionalNotes ?? "")
      }
    });
    await createMaterialReferences(tx, {
      links: rawLinks,
      fallbackType: "MENTAHAN",
      sourceType: "REQUEST",
      productId: product.id,
      productName: product.name,
      productKey: productSlug(product.name),
      requestId: created.id,
      titlePrefix: `${product.name} - Bahan Konten`,
      platform,
      note: created.title,
      requesterId
    });
    return created;
  });
}

export async function updatePendingLpRequest(
  userId: string,
  isAdmin: boolean,
  requestId: string,
  input: {
    productName: string;
    postPlatform: string;
    domainLpUrl: string;
    style: string;
    angle?: string | null;
    referenceLinks?: string[];
    deadlineAt: Date;
    additionalNotes?: string | null;
  }
) {
  const platform = assertValue(input.postPlatform, PLATFORMS, "Platform");
  const style = assertValue(input.style, STYLES, "Style");
  assertDate(input.deadlineAt);
  if (!input.domainLpUrl.trim()) throw new Error("Domain/link LP wajib diisi.");

  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Request tidak ditemukan.");
    assertPendingRequestPermission(userId, isAdmin, request);
    const product = await ensureProductByName(input.productName, tx);
    const referenceLinks = cleanLinks(input.referenceLinks ?? []);
    const updated = await tx.workRequest.update({
      where: { id: requestId },
      data: {
        productName: product.name,
        productKey: productSlug(product.name),
        productId: product.id,
        title: `LP - ${product.name}`,
        postPlatform: platform,
        style,
        angle: optionalString(input.angle ?? ""),
        domainLpUrl: externalHref(input.domainLpUrl),
        referenceLinks: serializeLinks(referenceLinks),
        deadlineAt: input.deadlineAt,
        additionalNotes: optionalString(input.additionalNotes ?? "")
      }
    });
    await tx.materialReference.deleteMany({ where: { requestId, sourceType: "REQUEST" } });
    await createMaterialReferences(tx, {
      links: referenceLinks,
      fallbackType: "REFERENSI",
      sourceType: "REQUEST",
      productId: product.id,
      productName: product.name,
      productKey: productSlug(product.name),
      requestId,
      titlePrefix: `${product.name} - Referensi LP`,
      platform,
      note: updated.title,
      requesterId: updated.requesterId
    });
    return updated;
  });
}

export async function updatePendingContentRequest(
  userId: string,
  isAdmin: boolean,
  requestId: string,
  input: {
    productName: string;
    videoAmount: number;
    imageAmount: number;
    useFrame: string;
    postPlatform: string;
    rawOrReferenceLinks?: string[];
    angle?: string | null;
    hook?: string | null;
    deadlineAt: Date;
    additionalNotes?: string | null;
  }
) {
  const platform = assertValue(input.postPlatform, CONTENT_PLATFORMS, "Platform");
  const useFrame = assertValue(input.useFrame, USE_FRAMES, "Pakai frame");
  assertDate(input.deadlineAt);
  const videoAmount = Math.max(0, Math.floor(input.videoAmount || 0));
  const imageAmount = Math.max(0, Math.floor(input.imageAmount || 0));
  if (videoAmount + imageAmount < 1) {
    throw new Error("Jumlah video + gambar minimal 1.");
  }

  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Request tidak ditemukan.");
    assertPendingRequestPermission(userId, isAdmin, request);
    const product = await ensureProductByName(input.productName, tx);
    const rawLinks = cleanLinks(input.rawOrReferenceLinks ?? []);
    const updated = await tx.workRequest.update({
      where: { id: requestId },
      data: {
        productName: product.name,
        productKey: productSlug(product.name),
        productId: product.id,
        title: `Konten - ${product.name}`,
        postPlatform: platform,
        videoAmount,
        imageAmount,
        useFrame,
        rawOrReferenceLinks: serializeLinks(rawLinks),
        angle: optionalString(input.angle ?? ""),
        hook: optionalString(input.hook ?? ""),
        deadlineAt: input.deadlineAt,
        additionalNotes: optionalString(input.additionalNotes ?? "")
      }
    });
    await tx.materialReference.deleteMany({ where: { requestId, sourceType: "REQUEST" } });
    await createMaterialReferences(tx, {
      links: rawLinks,
      fallbackType: "MENTAHAN",
      sourceType: "REQUEST",
      productId: product.id,
      productName: product.name,
      productKey: productSlug(product.name),
      requestId,
      titlePrefix: `${product.name} - Bahan Konten`,
      platform,
      note: updated.title,
      requesterId: updated.requesterId
    });
    return updated;
  });
}

export async function deletePendingRequest(userId: string, isAdmin: boolean, requestId: string) {
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Request tidak ditemukan.");
    assertPendingRequestPermission(userId, isAdmin, request);
    return tx.workRequest.delete({ where: { id: requestId } });
  });
}

export async function startTask(userId: string, requestId: string) {
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({
      where: { id: requestId },
      include: {
        timeLogs: {
          where: { endedAt: null }
        }
      }
    });
    if (!request) throw new Error("Task tidak ditemukan.");
    if (!["BELUM", "REVISI"].includes(request.status)) {
      throw new Error("Task hanya bisa dimulai dari status BELUM atau REVISI.");
    }
    if (request.timeLogs.length > 0) {
      throw new Error("Task masih memiliki timer aktif.");
    }

    const revisionCount = await tx.workTimeLog.count({
      where: {
        requestId,
        logType: { startsWith: "REVISION_" }
      }
    });
    const logType = request.status === "REVISI" ? `REVISION_${revisionCount + 1}` : "INITIAL_WORK";
    const now = new Date();

    await tx.workRequest.update({
      where: { id: requestId },
      data: {
        status: "DIKERJAKAN",
        creatorId: request.creatorId ?? userId,
        startedAt: request.startedAt ?? now
      }
    });

    return tx.workTimeLog.create({
      data: {
        requestId,
        creatorId: request.creatorId ?? userId,
        logType,
        startedAt: now
      }
    });
  });
}

export async function submitTask(
  userId: string,
  requestId: string,
  input: {
    lpLink?: string | null;
    videoLinks?: string[];
    imageLinks?: string[];
    additionalLinks?: string[];
    note?: string | null;
  }
) {
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({
      where: { id: requestId },
      include: {
        timeLogs: {
          where: { endedAt: null },
          orderBy: { startedAt: "desc" },
          take: 1
        },
        submissions: true
      }
    });
    if (!request) throw new Error("Task tidak ditemukan.");
    if (request.status !== "DIKERJAKAN") throw new Error("Task belum dalam status DIKERJAKAN.");
    if (request.creatorId && request.creatorId !== userId) {
      throw new Error("Task ini sudah diklaim CC lain.");
    }
    const activeLog = request.timeLogs[0];
    if (!activeLog) throw new Error("Timer aktif tidak ditemukan.");

    const assets: AssetInput[] = [];
    if (request.requestType === "LP") {
      const lpLink = input.lpLink?.trim();
      if (lpLink) {
        assets.push({ kind: "LP", title: `${request.productName} - Landing Page`, link: lpLink });
      }
    } else {
      cleanLinks(input.videoLinks ?? []).forEach((link, index) => {
        assets.push({ kind: "VIDEO", title: `${request.productName} - Video ${index + 1}`, link });
      });
      cleanLinks(input.imageLinks ?? []).forEach((link, index) => {
        assets.push({ kind: "IMAGE", title: `${request.productName} - Gambar ${index + 1}`, link });
      });
    }

    const cleanedAssets = cleanAssets(assets);
    if (cleanedAssets.length < 1) {
      throw new Error("Minimal satu link hasil wajib diisi.");
    }

    const version = request.submissions.length + 1;
    const videoCount = cleanedAssets.filter((asset) => asset.kind === "VIDEO").length;
    const imageCount = cleanedAssets.filter((asset) => asset.kind === "IMAGE").length;
    const now = new Date();
    const durationSeconds = Math.max(0, Math.floor((now.getTime() - activeLog.startedAt.getTime()) / 1000));

    const additionalLinks = cleanLinks(input.additionalLinks ?? []);
    const submission = await tx.workSubmission.create({
      data: {
        requestId,
        creatorId: request.creatorId ?? userId,
        submissionType: version === 1 ? "INITIAL" : "REVISION",
        mainLink: cleanedAssets[0].link,
        additionalLinks: serializeLinks(additionalLinks),
        submittedVideoAmount: videoCount,
        submittedImageAmount: imageCount,
        note: optionalString(input.note ?? ""),
        version,
        assets: {
          create: cleanedAssets.map((asset, index) => ({
            requestId,
            assetKind: asset.kind,
            title: asset.title,
            link: asset.link,
            note: asset.note,
            sortOrder: index
          }))
        }
      },
      include: { assets: true }
    });

    await createMaterialReferences(tx, {
      links: additionalLinks,
      fallbackType: "MENTAHAN",
      sourceType: "SUBMISSION",
      productId: request.productId,
      productName: request.productName,
      productKey: request.productKey,
      requestId,
      submissionId: submission.id,
      titlePrefix: `${request.productName} - Bundle Submission`,
      platform: request.postPlatform,
      note: submission.note,
      requesterId: request.requesterId,
      creatorId: request.creatorId ?? userId
    });

    await tx.workTimeLog.update({
      where: { id: activeLog.id },
      data: {
        endedAt: now,
        durationSeconds,
        note: optionalString(input.note ?? "")
      }
    });

    await tx.workRequest.update({
      where: { id: requestId },
      data: {
        status: "SUDAH",
        creatorId: request.creatorId ?? userId
      }
    });

    return submission;
  });
}

export async function requestRevision(reviewerId: string, requestId: string, revisionNote: string) {
  if (!revisionNote.trim()) throw new Error("Catatan revisi wajib diisi.");
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Task tidak ditemukan.");
    if (request.status !== "SUDAH") throw new Error("Revisi hanya bisa diminta dari status SUDAH.");

    await tx.reviewLog.create({
      data: {
        requestId,
        reviewerId,
        decision: "REVISION_REQUESTED",
        reviewNote: revisionNote.trim()
      }
    });

    return tx.workRequest.update({
      where: { id: requestId },
      data: { status: "REVISI" }
    });
  });
}

export async function returnRevision(userId: string, requestId: string, returnNote: string) {
  if (!returnNote.trim()) throw new Error("Alasan pengembalian revisi wajib diisi.");
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Task tidak ditemukan.");
    if (request.status !== "REVISI") throw new Error("Revisi hanya bisa dikembalikan dari status REVISI.");

    await tx.reviewLog.create({
      data: {
        requestId,
        reviewerId: userId,
        decision: "REVISION_RETURNED_BY_CC",
        reviewNote: returnNote.trim()
      }
    });
    await tx.taskNote.create({
      data: {
        requestId,
        userId,
        noteType: "REVISION_RETURN",
        note: returnNote.trim()
      }
    });

    return tx.workRequest.update({
      where: { id: requestId },
      data: { status: "REVISI_DIKEMBALIKAN" }
    });
  });
}

export async function clarifyRevision(reviewerId: string, requestId: string, clarificationNote: string) {
  if (!clarificationNote.trim()) throw new Error("Klarifikasi wajib diisi.");
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Task tidak ditemukan.");
    if (request.status !== "REVISI_DIKEMBALIKAN") {
      throw new Error("Klarifikasi hanya bisa diberikan untuk revisi dikembalikan.");
    }

    await tx.reviewLog.create({
      data: {
        requestId,
        reviewerId,
        decision: "CLARIFICATION",
        reviewNote: clarificationNote.trim()
      }
    });
    await tx.taskNote.create({
      data: {
        requestId,
        userId: reviewerId,
        noteType: "CLARIFICATION",
        note: clarificationNote.trim()
      }
    });

    return tx.workRequest.update({
      where: { id: requestId },
      data: { status: "REVISI" }
    });
  });
}

export async function accTask(reviewerId: string, requestId: string) {
  return db.$transaction(async (tx) => {
    const request = await tx.workRequest.findUnique({
      where: { id: requestId },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            assets: {
              orderBy: { sortOrder: "asc" }
            }
          }
        }
      }
    });
    if (!request) throw new Error("Task tidak ditemukan.");
    if (request.status !== "SUDAH") throw new Error("ACC hanya bisa dilakukan dari status SUDAH.");

    const latestSubmission = request.submissions[0];
    if (!latestSubmission || latestSubmission.assets.length < 1) {
      throw new Error("Submission terbaru tidak memiliki asset.");
    }

    await tx.reviewLog.create({
      data: {
        requestId,
        reviewerId,
        decision: "ACC",
        reviewNote: "ACC dan masuk Bank Konten"
      }
    });

    await tx.workRequest.update({
      where: { id: requestId },
      data: { status: "BERES" }
    });

    const created = [];
    for (const asset of latestSubmission.assets) {
      const videoUnit = asset.assetKind === "VIDEO" ? 1 : 0;
      const imageUnit = asset.assetKind === "IMAGE" ? 1 : 0;
      created.push(
        await tx.contentBank.create({
          data: {
            requestId,
            productId: request.productId,
            productName: request.productName,
            productKey: request.productKey,
            title: asset.title,
            assetType: request.requestType === "LP" ? "LP" : "CONTENT",
            assetKind: asset.assetKind,
            platform: request.postPlatform,
            style: request.style,
            angle: request.angle,
            hook: request.hook,
            requestedVideoAmount: request.videoAmount,
            requestedImageAmount: request.imageAmount,
            submittedVideoAmount: videoUnit,
            submittedImageAmount: imageUnit,
            mainLink: asset.link,
            additionalLinks: latestSubmission.additionalLinks,
            creatorId: latestSubmission.creatorId,
            requesterId: request.requesterId,
            testStatus: "READY_TEST"
          }
        })
      );
    }

    return created;
  });
}

export async function updateBankStatus(bankId: string, status: string) {
  const testStatus = assertValue(status, TEST_STATUSES, "Status test");
  return db.contentBank.update({
    where: { id: bankId },
    data: { testStatus }
  });
}

export async function createFeedback(
  reviewerId: string,
  bankId: string,
  input: {
    testStatus: string;
    testedPlatform?: string | null;
    testDate?: Date | null;
    testResult?: string | null;
    score1?: number | null;
    score2?: number | null;
    score3?: number | null;
    score4?: number | null;
    score5?: number | null;
    budgetSpent?: number | null;
    spend?: number | null;
    ctr?: number | null;
    cpc?: number | null;
    cpm?: number | null;
    cpl?: number | null;
    roas?: number | null;
    leads?: number | null;
    sales?: number | null;
    revenue?: number | null;
    profit?: number | null;
    conversionRate?: number | null;
    feedbackNote?: string | null;
    suggestionForCreator?: string | null;
  }
) {
  const testStatus = assertValue(input.testStatus, TEST_STATUSES, "Status test");
  const testedPlatform = input.testedPlatform ? assertValue(input.testedPlatform, PLATFORMS, "Platform test") : null;
  const scores = [input.score1, input.score2, input.score3, input.score4, input.score5].filter(
    (value): value is number => typeof value === "number" && value >= 1 && value <= 5
  );
  const totalScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) : null;

  return db.$transaction(async (tx) => {
    const feedback = await tx.assetFeedback.create({
      data: {
        contentBankId: bankId,
        reviewerId,
        testStatus,
        testedPlatform,
        testDate: input.testDate ?? null,
        testResult: optionalString(input.testResult ?? ""),
        budgetSpent: input.budgetSpent ?? null,
        spend: input.spend ?? null,
        ctr: input.ctr ?? null,
        cpc: input.cpc ?? null,
        cpm: input.cpm ?? null,
        cpl: input.cpl ?? null,
        roas: input.roas ?? null,
        leads: input.leads == null ? null : Math.floor(input.leads),
        sales: input.sales == null ? null : Math.floor(input.sales),
        revenue: input.revenue ?? null,
        profit: input.profit ?? null,
        conversionRate: input.conversionRate ?? null,
        score1: input.score1 ?? null,
        score2: input.score2 ?? null,
        score3: input.score3 ?? null,
        score4: input.score4 ?? null,
        score5: input.score5 ?? null,
        totalScore,
        feedbackNote: optionalString(input.feedbackNote ?? ""),
        suggestionForCreator: optionalString(input.suggestionForCreator ?? "")
      }
    });

    await tx.contentBank.update({
      where: { id: bankId },
      data: {
        testStatus,
        scoreTotal: totalScore,
        feedbackCount: { increment: 1 }
      }
    });

    return feedback;
  });
}

export async function setCreatorOff(
  userId: string,
  input: {
    reason: string;
    note?: string | null;
    expectedUntil?: Date | null;
  }
) {
  const reason = assertValue(input.reason, OFF_REASONS, "Alasan OFF");
  return db.$transaction(async (tx) => {
    await tx.creatorStatusLog.updateMany({
      where: { userId, status: "OFF", endedAt: null },
      data: {
        endedAt: new Date()
      }
    });
    return tx.creatorStatusLog.create({
      data: {
        userId,
        status: "OFF",
        reason,
        note: optionalString(input.note ?? ""),
        startedAt: new Date(),
        expectedUntil: input.expectedUntil ?? null
      }
    });
  });
}

export async function setCreatorOn(userId: string) {
  const now = new Date();
  const active = await db.creatorStatusLog.findFirst({
    where: { userId, status: "OFF", endedAt: null },
    orderBy: { startedAt: "desc" }
  });
  if (!active) {
    return db.creatorStatusLog.create({
      data: {
        userId,
        status: "ON",
        startedAt: now,
        endedAt: now,
        durationSeconds: 0
      }
    });
  }
  const durationSeconds = Math.max(0, Math.floor((now.getTime() - active.startedAt.getTime()) / 1000));
  return db.creatorStatusLog.update({
    where: { id: active.id },
    data: {
      endedAt: now,
      durationSeconds
    }
  });
}
