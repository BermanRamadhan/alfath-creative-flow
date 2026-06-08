import { TEST_STATUS_LABELS, STATUS_LABELS } from "@/lib/constants";
import { isOverdue } from "@/lib/utils";

const statusTone: Record<string, string> = {
  BELUM: "amber",
  DIKERJAKAN: "blue",
  SUDAH: "green",
  REVISI: "amber",
  REVISI_DIKEMBALIKAN: "red",
  BERES: "green",
  READY_TEST: "blue",
  WINNER: "green",
  LOSER: "red",
  BIASA: "amber",
  ARCHIVED: ""
};

export function Badge({ label, tone }: { label: string; tone?: string }) {
  return <span className={`badge ${tone ?? ""}`}>{label}</span>;
}

export function StatusBadge({ status, deadlineAt }: { status: string; deadlineAt?: Date | string }) {
  return (
    <span className="split-line">
      <Badge label={STATUS_LABELS[status] ?? status} tone={statusTone[status]} />
      {deadlineAt && isOverdue(status, deadlineAt) ? <Badge label="OVERDUE" tone="red" /> : null}
    </span>
  );
}

export function TestStatusBadge({ status }: { status: string }) {
  return <Badge label={TEST_STATUS_LABELS[status] ?? status} tone={statusTone[status]} />;
}
