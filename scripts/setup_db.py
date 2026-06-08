from pathlib import Path
import sqlite3


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "prisma" / "dev.db"


TABLES = [
    "AssetFeedback",
    "ContentBank",
    "MaterialReference",
    "ReviewLog",
    "TaskNote",
    "SubmissionAsset",
    "WorkSubmission",
    "WorkTimeLog",
    "WorkRequest",
    "RequestDraft",
    "CreatorStatusLog",
    "Session",
    "AppSetting",
    "Product",
    "User",
]


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("PRAGMA foreign_keys = OFF;")
        for table in TABLES:
            conn.execute(f'DROP TABLE IF EXISTS "{table}";')
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.executescript(
            """
            CREATE TABLE "User" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "username" TEXT NOT NULL UNIQUE,
              "passwordHash" TEXT NOT NULL,
              "displayName" TEXT NOT NULL,
              "whatsappNumber" TEXT,
              "role" TEXT NOT NULL,
              "isActive" BOOLEAN NOT NULL DEFAULT 1,
              "darkMode" BOOLEAN NOT NULL DEFAULT 0,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE "Session" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "token" TEXT NOT NULL UNIQUE,
              "userId" TEXT NOT NULL,
              "expiresAt" DATETIME NOT NULL,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            );

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
            );

            CREATE TABLE "Product" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "name" TEXT NOT NULL,
              "normalizedName" TEXT NOT NULL UNIQUE,
              "category" TEXT,
              "niche" TEXT,
              "description" TEXT,
              "notes" TEXT,
              "mainLpUrl" TEXT,
              "driveReferenceUrl" TEXT,
              "tags" TEXT,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE "WorkRequest" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "requestType" TEXT NOT NULL,
              "productName" TEXT NOT NULL,
              "productKey" TEXT NOT NULL,
              "productId" TEXT,
              "requesterId" TEXT NOT NULL,
              "creatorId" TEXT,
              "title" TEXT NOT NULL,
              "postPlatform" TEXT NOT NULL,
              "style" TEXT,
              "angle" TEXT,
              "hook" TEXT,
              "domainLpUrl" TEXT,
              "referenceLinks" TEXT,
              "rawOrReferenceLinks" TEXT,
              "videoAmount" INTEGER NOT NULL DEFAULT 0,
              "imageAmount" INTEGER NOT NULL DEFAULT 0,
              "useFrame" TEXT,
              "deadlineAt" DATETIME NOT NULL,
              "additionalNotes" TEXT,
              "status" TEXT NOT NULL DEFAULT 'BELUM',
              "startedAt" DATETIME,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "WorkRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
              CONSTRAINT "WorkRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
              CONSTRAINT "WorkRequest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
            );

            CREATE TABLE "WorkTimeLog" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "requestId" TEXT NOT NULL,
              "creatorId" TEXT NOT NULL,
              "logType" TEXT NOT NULL,
              "startedAt" DATETIME NOT NULL,
              "endedAt" DATETIME,
              "durationSeconds" INTEGER,
              "note" TEXT,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "WorkTimeLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT "WorkTimeLog_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE "WorkSubmission" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "requestId" TEXT NOT NULL,
              "creatorId" TEXT NOT NULL,
              "submissionType" TEXT NOT NULL,
              "mainLink" TEXT NOT NULL,
              "additionalLinks" TEXT,
              "submittedVideoAmount" INTEGER NOT NULL DEFAULT 0,
              "submittedImageAmount" INTEGER NOT NULL DEFAULT 0,
              "note" TEXT,
              "version" INTEGER NOT NULL DEFAULT 1,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "WorkSubmission_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT "WorkSubmission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE "SubmissionAsset" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "submissionId" TEXT NOT NULL,
              "requestId" TEXT NOT NULL,
              "assetKind" TEXT NOT NULL,
              "title" TEXT NOT NULL,
              "link" TEXT NOT NULL,
              "note" TEXT,
              "sortOrder" INTEGER NOT NULL DEFAULT 0,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "SubmissionAsset_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "WorkSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            );

            CREATE TABLE "TaskNote" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "requestId" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "noteType" TEXT NOT NULL DEFAULT 'GENERAL',
              "note" TEXT NOT NULL,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "TaskNote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT "TaskNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE "ReviewLog" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "requestId" TEXT NOT NULL,
              "reviewerId" TEXT NOT NULL,
              "decision" TEXT NOT NULL,
              "reviewNote" TEXT,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "ReviewLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT "ReviewLog_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE "ContentBank" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "requestId" TEXT NOT NULL,
              "productId" TEXT,
              "productName" TEXT NOT NULL,
              "productKey" TEXT NOT NULL,
              "title" TEXT NOT NULL,
              "assetType" TEXT NOT NULL,
              "assetKind" TEXT NOT NULL,
              "platform" TEXT NOT NULL,
              "style" TEXT,
              "angle" TEXT,
              "hook" TEXT,
              "requestedVideoAmount" INTEGER NOT NULL DEFAULT 0,
              "requestedImageAmount" INTEGER NOT NULL DEFAULT 0,
              "submittedVideoAmount" INTEGER NOT NULL DEFAULT 0,
              "submittedImageAmount" INTEGER NOT NULL DEFAULT 0,
              "mainLink" TEXT NOT NULL,
              "additionalLinks" TEXT,
              "creatorId" TEXT,
              "requesterId" TEXT NOT NULL,
              "testStatus" TEXT NOT NULL DEFAULT 'READY_TEST',
              "scoreTotal" INTEGER,
              "feedbackCount" INTEGER NOT NULL DEFAULT 0,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "ContentBank_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "WorkRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT "ContentBank_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
              CONSTRAINT "ContentBank_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
              CONSTRAINT "ContentBank_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE "MaterialReference" (
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

            CREATE TABLE "AssetFeedback" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "contentBankId" TEXT NOT NULL,
              "reviewerId" TEXT NOT NULL,
              "testStatus" TEXT,
              "testedPlatform" TEXT,
              "testDate" DATETIME,
              "testResult" TEXT,
              "budgetSpent" REAL,
              "spend" REAL,
              "ctr" REAL,
              "cpc" REAL,
              "cpm" REAL,
              "cpl" REAL,
              "roas" REAL,
              "leads" INTEGER,
              "sales" INTEGER,
              "revenue" REAL,
              "profit" REAL,
              "conversionRate" REAL,
              "score1" INTEGER,
              "score2" INTEGER,
              "score3" INTEGER,
              "score4" INTEGER,
              "score5" INTEGER,
              "totalScore" INTEGER,
              "feedbackNote" TEXT,
              "suggestionForCreator" TEXT,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "AssetFeedback_contentBankId_fkey" FOREIGN KEY ("contentBankId") REFERENCES "ContentBank" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
              CONSTRAINT "AssetFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );

            CREATE TABLE "CreatorStatusLog" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "userId" TEXT NOT NULL,
              "status" TEXT NOT NULL,
              "reason" TEXT,
              "note" TEXT,
              "startedAt" DATETIME NOT NULL,
              "expectedUntil" DATETIME,
              "endedAt" DATETIME,
              "durationSeconds" INTEGER,
              "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT "CreatorStatusLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            );

            CREATE TABLE "AppSetting" (
              "key" TEXT NOT NULL PRIMARY KEY,
              "value" TEXT,
              "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX "Session_userId_idx" ON "Session"("userId");
            CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
            CREATE INDEX "RequestDraft_requestType_idx" ON "RequestDraft"("requestType");
            CREATE INDEX "RequestDraft_requesterId_idx" ON "RequestDraft"("requesterId");
            CREATE INDEX "RequestDraft_updatedAt_idx" ON "RequestDraft"("updatedAt");
            CREATE INDEX "WorkRequest_requestType_idx" ON "WorkRequest"("requestType");
            CREATE INDEX "WorkRequest_status_idx" ON "WorkRequest"("status");
            CREATE INDEX "WorkRequest_deadlineAt_idx" ON "WorkRequest"("deadlineAt");
            CREATE INDEX "WorkRequest_productKey_idx" ON "WorkRequest"("productKey");
            CREATE INDEX "WorkRequest_requesterId_idx" ON "WorkRequest"("requesterId");
            CREATE INDEX "WorkRequest_creatorId_idx" ON "WorkRequest"("creatorId");
            CREATE INDEX "WorkTimeLog_requestId_idx" ON "WorkTimeLog"("requestId");
            CREATE INDEX "WorkTimeLog_creatorId_idx" ON "WorkTimeLog"("creatorId");
            CREATE INDEX "WorkTimeLog_endedAt_idx" ON "WorkTimeLog"("endedAt");
            CREATE INDEX "WorkSubmission_requestId_idx" ON "WorkSubmission"("requestId");
            CREATE INDEX "WorkSubmission_creatorId_idx" ON "WorkSubmission"("creatorId");
            CREATE INDEX "SubmissionAsset_submissionId_idx" ON "SubmissionAsset"("submissionId");
            CREATE INDEX "SubmissionAsset_requestId_idx" ON "SubmissionAsset"("requestId");
            CREATE INDEX "SubmissionAsset_assetKind_idx" ON "SubmissionAsset"("assetKind");
            CREATE INDEX "TaskNote_requestId_idx" ON "TaskNote"("requestId");
            CREATE INDEX "TaskNote_userId_idx" ON "TaskNote"("userId");
            CREATE INDEX "ReviewLog_requestId_idx" ON "ReviewLog"("requestId");
            CREATE INDEX "ReviewLog_reviewerId_idx" ON "ReviewLog"("reviewerId");
            CREATE INDEX "ContentBank_requestId_idx" ON "ContentBank"("requestId");
            CREATE INDEX "ContentBank_productKey_idx" ON "ContentBank"("productKey");
            CREATE INDEX "ContentBank_assetType_idx" ON "ContentBank"("assetType");
            CREATE INDEX "ContentBank_assetKind_idx" ON "ContentBank"("assetKind");
            CREATE INDEX "ContentBank_testStatus_idx" ON "ContentBank"("testStatus");
            CREATE INDEX "ContentBank_creatorId_idx" ON "ContentBank"("creatorId");
            CREATE INDEX "MaterialReference_materialType_idx" ON "MaterialReference"("materialType");
            CREATE INDEX "MaterialReference_sourceType_idx" ON "MaterialReference"("sourceType");
            CREATE INDEX "MaterialReference_productKey_idx" ON "MaterialReference"("productKey");
            CREATE INDEX "MaterialReference_requestId_idx" ON "MaterialReference"("requestId");
            CREATE INDEX "MaterialReference_submissionId_idx" ON "MaterialReference"("submissionId");
            CREATE INDEX "MaterialReference_requesterId_idx" ON "MaterialReference"("requesterId");
            CREATE INDEX "MaterialReference_creatorId_idx" ON "MaterialReference"("creatorId");
            CREATE INDEX "AssetFeedback_contentBankId_idx" ON "AssetFeedback"("contentBankId");
            CREATE INDEX "AssetFeedback_reviewerId_idx" ON "AssetFeedback"("reviewerId");
            CREATE INDEX "CreatorStatusLog_userId_idx" ON "CreatorStatusLog"("userId");
            CREATE INDEX "CreatorStatusLog_status_idx" ON "CreatorStatusLog"("status");
            CREATE INDEX "CreatorStatusLog_endedAt_idx" ON "CreatorStatusLog"("endedAt");
            """
        )
        conn.commit()
    finally:
        conn.close()

    print(f"SQLite schema ready at {DB_PATH}")


if __name__ == "__main__":
    main()
