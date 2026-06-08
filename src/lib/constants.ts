export const ROLES = ["ADMIN", "ADVERTISER", "CC"] as const;
export const REQUEST_TYPES = ["LP", "CONTENT"] as const;
export const PLATFORMS = ["META", "TIKTOK", "ORGANIC", "WEBSITE", "SHOPEE", "LAINNYA"] as const;
export const CONTENT_PLATFORMS = ["META", "TIKTOK", "ORGANIC", "SHOPEE", "LAINNYA"] as const;
export const STYLES = ["HARDSELLING", "SOFTSELLING"] as const;
export const USE_FRAMES = ["YA", "TIDAK", "BEBAS_CREATOR"] as const;
export const TASK_STATUSES = ["BELUM", "DIKERJAKAN", "SUDAH", "REVISI", "REVISI_DIKEMBALIKAN", "BERES"] as const;
export const TEST_STATUSES = ["READY_TEST", "WINNER", "LOSER", "BIASA", "ARCHIVED"] as const;
export const ASSET_KINDS = ["LP", "VIDEO", "IMAGE", "OTHER"] as const;
export const MATERIAL_TYPES = ["MENTAHAN", "REFERENSI", "JSON_TEMPLATE", "LAINNYA"] as const;
export const MATERIAL_SOURCES = ["REQUEST", "SUBMISSION", "MANUAL"] as const;
export const OFF_REASONS = ["SAKIT", "IZIN", "PROJECT_LUAR", "ISTIRAHAT", "LAINNYA"] as const;

export type Role = (typeof ROLES)[number];
export type RequestType = (typeof REQUEST_TYPES)[number];
export type Platform = (typeof PLATFORMS)[number];
export type Style = (typeof STYLES)[number];
export type UseFrame = (typeof USE_FRAMES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TestStatus = (typeof TEST_STATUSES)[number];
export type AssetKind = (typeof ASSET_KINDS)[number];
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ADVERTISER: "Advertiser",
  CC: "Content Creator"
};

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  LP: "Landing Page",
  CONTENT: "Konten"
};

export const PLATFORM_LABELS: Record<string, string> = {
  META: "Meta",
  TIKTOK: "TikTok",
  ORGANIC: "Organic",
  WEBSITE: "Website",
  SHOPEE: "Shopee",
  LAINNYA: "Lainnya"
};

export const STYLE_LABELS: Record<string, string> = {
  HARDSELLING: "Hardselling",
  SOFTSELLING: "Softselling"
};

export const USE_FRAME_LABELS: Record<string, string> = {
  YA: "Ya",
  TIDAK: "Tidak",
  BEBAS_CREATOR: "Bebas CC"
};

export const STATUS_LABELS: Record<string, string> = {
  BELUM: "Belum",
  DIKERJAKAN: "Dikerjakan",
  SUDAH: "Sudah",
  REVISI: "Revisi",
  REVISI_DIKEMBALIKAN: "Revisi Dikembalikan",
  BERES: "Beres"
};

export const TEST_STATUS_LABELS: Record<string, string> = {
  READY_TEST: "Siap Tes",
  WINNER: "Pemenang",
  LOSER: "Kalah",
  BIASA: "Biasa",
  ARCHIVED: "Arsip"
};

export const ASSET_KIND_LABELS: Record<string, string> = {
  LP: "Landing Page",
  VIDEO: "Video",
  IMAGE: "Gambar",
  OTHER: "Asset"
};

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  MENTAHAN: "Mentahan",
  REFERENSI: "Referensi",
  JSON_TEMPLATE: "Template JSON",
  LAINNYA: "Lainnya"
};

export const MATERIAL_SOURCE_LABELS: Record<string, string> = {
  REQUEST: "Dari Request",
  SUBMISSION: "Dari Submission",
  MANUAL: "Manual"
};

export const WORK_LOG_LABELS: Record<string, string> = {
  INITIAL_WORK: "Kerja awal"
};

export const REVIEW_DECISION_LABELS: Record<string, string> = {
  ACC: "ACC",
  REVISION_REQUESTED: "Minta revisi",
  REVISION_RETURNED_BY_CC: "Dikembalikan CC",
  CLARIFICATION: "Klarifikasi advertiser"
};

export const NOTE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "Catatan",
  KENDALA: "Kendala",
  CLARIFICATION: "Klarifikasi",
  REVISION_RETURN: "Revisi dikembalikan"
};

export const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  INITIAL: "Submit awal",
  REVISION: "Submit revisi"
};

export const OFF_REASON_LABELS: Record<string, string> = {
  SAKIT: "Sakit",
  IZIN: "Izin",
  PROJECT_LUAR: "Project luar",
  ISTIRAHAT: "Istirahat",
  LAINNYA: "Lainnya"
};

export function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}
