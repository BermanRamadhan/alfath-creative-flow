const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const IMPORT_ORDER = [
  "User",
  "AppSetting",
  "Product",
  "RequestDraft",
  "WorkRequest",
  "WorkTimeLog",
  "WorkSubmission",
  "SubmissionAsset",
  "TaskNote",
  "ReviewLog",
  "MaterialReference",
  "ContentBank",
  "AssetFeedback",
  "CreatorStatusLog"
];

const MODEL = {
  User: "user",
  AppSetting: "appSetting",
  Product: "product",
  RequestDraft: "requestDraft",
  WorkRequest: "workRequest",
  WorkTimeLog: "workTimeLog",
  WorkSubmission: "workSubmission",
  SubmissionAsset: "submissionAsset",
  TaskNote: "taskNote",
  ReviewLog: "reviewLog",
  MaterialReference: "materialReference",
  ContentBank: "contentBank",
  AssetFeedback: "assetFeedback",
  CreatorStatusLog: "creatorStatusLog"
};

const DELETE_ORDER = [
  "AssetFeedback",
  "ContentBank",
  "MaterialReference",
  "ReviewLog",
  "TaskNote",
  "SubmissionAsset",
  "WorkSubmission",
  "WorkTimeLog",
  "RequestDraft",
  "CreatorStatusLog",
  "WorkRequest",
  "AppSetting",
  "Product",
  "User"
];

const DATE_FIELDS = {
  User: ["createdAt", "updatedAt"],
  AppSetting: ["updatedAt"],
  Product: ["createdAt", "updatedAt"],
  RequestDraft: ["deadlineAt", "createdAt", "updatedAt"],
  WorkRequest: ["deadlineAt", "startedAt", "createdAt", "updatedAt"],
  WorkTimeLog: ["startedAt", "endedAt", "createdAt"],
  WorkSubmission: ["createdAt"],
  SubmissionAsset: ["createdAt"],
  TaskNote: ["createdAt"],
  ReviewLog: ["createdAt"],
  MaterialReference: ["createdAt", "updatedAt"],
  ContentBank: ["createdAt", "updatedAt"],
  AssetFeedback: ["testDate", "createdAt"],
  CreatorStatusLog: ["startedAt", "expectedUntil", "endedAt", "createdAt"]
};

function toDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return new Date(value);
  return new Date(value);
}

function normalizeRow(table, row) {
  const next = { ...row };
  for (const field of DATE_FIELDS[table] ?? []) {
    next[field] = toDate(next[field]);
  }
  if (table === "User") {
    next.isActive = Boolean(next.isActive);
    next.darkMode = Boolean(next.darkMode);
  }
  return next;
}

async function readCurrentCounts(client) {
  const counts = {};
  for (const table of IMPORT_ORDER) {
    counts[table] = await client[MODEL[table]].count();
  }
  return counts;
}

async function backupCurrentNeon() {
  const backup = {};
  for (const table of IMPORT_ORDER) {
    backup[table] = await prisma[MODEL[table]].findMany();
  }
  const backupDir = path.join(process.cwd(), ".tmp");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `neon-before-local-import-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), tables: backup }, null, 2));
  return backupPath;
}

async function main() {
  const exportPath = process.argv[2] ?? path.join(process.cwd(), ".tmp", "sqlite-local-export.json");
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export file not found: ${exportPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(exportPath, "utf8"));
  const sourceTables = payload.tables ?? {};
  const beforeCounts = await readCurrentCounts(prisma);
  const backupPath = await backupCurrentNeon();

  await prisma.$transaction(
    async (tx) => {
      for (const table of DELETE_ORDER) {
        await tx[MODEL[table]].deleteMany();
      }

      for (const table of IMPORT_ORDER) {
        const rows = sourceTables[table] ?? [];
        if (rows.length) {
          await tx[MODEL[table]].createMany({
            data: rows.map((row) => normalizeRow(table, row))
          });
        }
      }
    },
    { timeout: 120000, maxWait: 120000 }
  );

  const afterCounts = await readCurrentCounts(prisma);
  console.log(
    JSON.stringify(
      {
        source: payload.source,
        exportPath,
        backupPath,
        beforeCounts,
        importedCounts: afterCounts
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
