import {
  NOTE_TYPE_LABELS,
  REVIEW_DECISION_LABELS,
  STATUS_LABELS,
  SUBMISSION_TYPE_LABELS,
  WORK_LOG_LABELS
} from "@/lib/constants";

export const APP_TIME_ZONE = "Asia/Jakarta";

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const INPUT_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const INPUT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function jakartaDateTimeParts(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function normalizeProductName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function productSlug(value: string) {
  return normalizeProductName(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function compactDate(value: Date | string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(date);
}

export function fullDate(value: Date | string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(date);
}

export function dateInputValue(value?: Date | string | null) {
  if (!value) return "";
  const parts = jakartaDateTimeParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function dateOnlyInputValue(value?: Date | string | null) {
  if (!value) return "";
  const parts = jakartaDateTimeParts(value);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parseJakartaDateTimeInput(value?: string | null) {
  const match = value?.trim().match(INPUT_DATE_TIME_PATTERN);
  if (!match) return new Date("");
  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const second = Number(secondRaw ?? "0");
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - JAKARTA_OFFSET_MS);
  if (dateInputValue(date) !== `${yearRaw}-${monthRaw}-${dayRaw}T${hourRaw}:${minuteRaw}`) return new Date("");
  return date;
}

export function parseJakartaDateInput(value?: string | null) {
  const match = value?.trim().match(INPUT_DATE_PATTERN);
  if (!match) return new Date("");
  return parseJakartaDateTimeInput(`${match[1]}-${match[2]}-${match[3]}T00:00`);
}

export function startOfJakartaDay(value: Date | string = new Date()) {
  const day = dateOnlyInputValue(value);
  return day ? parseJakartaDateTimeInput(`${day}T00:00`) : new Date("");
}

export function startOfTodayJakarta() {
  return startOfJakartaDay(new Date());
}

export function addJakartaDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function codeLabel(value?: string | null) {
  if (!value) return "-";
  return titleCase(value.replace(/_/g, " "));
}

export function workLogLabel(value?: string | null) {
  if (!value) return "-";
  const revisionMatch = value.match(/^REVISION_(\d+)$/);
  if (revisionMatch) return `Revisi ${revisionMatch[1]}`;
  return WORK_LOG_LABELS[value] ?? codeLabel(value);
}

export function reviewDecisionLabel(value?: string | null) {
  if (!value) return "-";
  return REVIEW_DECISION_LABELS[value] ?? codeLabel(value);
}

export function noteTypeLabel(value?: string | null) {
  if (!value) return "-";
  return NOTE_TYPE_LABELS[value] ?? codeLabel(value);
}

export function submissionTypeLabel(value?: string | null) {
  if (!value) return "-";
  return SUBMISSION_TYPE_LABELS[value] ?? codeLabel(value);
}

export function isOverdue(status: string, deadlineAt: Date | string) {
  return status !== "BERES" && new Date(deadlineAt).getTime() < Date.now();
}

export function statusText(status: string) {
  return STATUS_LABELS[status] ?? codeLabel(status);
}

export function parseLinks(value: FormDataEntryValue | string | null | undefined) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeLinks(links: string[]) {
  const clean = links.map((link) => link.trim()).filter(Boolean);
  return clean.length ? JSON.stringify(clean) : null;
}

export function deserializeLinks(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function externalHref(value?: string | null) {
  const link = value?.trim();
  if (!link) return "#";
  if (/^(https?:|mailto:|tel:|whatsapp:|tg:)/i.test(link)) return link;
  if (link.startsWith("//")) return `https:${link}`;
  return `https://${link.replace(/^\/+/, "")}`;
}

export function normalizeWhatsappNumber(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function waMeHref(number?: string | null, message = "") {
  const normalized = normalizeWhatsappNumber(number);
  if (!normalized) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${query}`;
}

export function numberFromForm(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function stringFromForm(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function optionalString(value: string) {
  return value.trim() ? value.trim() : null;
}

export function money(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function scoreLabel(score?: number | null) {
  return score == null ? "Unscored" : `${score}/25`;
}
