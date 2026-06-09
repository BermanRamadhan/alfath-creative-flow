import "server-only";

import { db } from "@/lib/db";
import type { NavAlerts } from "@/lib/nav-types";

const emptyAlerts: NavAlerts = {
  dashboard: false,
  request: false,
  task: false,
  review: false,
  bank: false,
  materials: false,
  products: false,
  reports: false,
  team: false,
  settings: false
};

export async function getNavAlerts(user: { id: string; role: string; whatsappNumber?: string | null }): Promise<NavAlerts> {
  const now = new Date();

  try {
    const [draftCount, pendingEditableCount, taskCount, reviewCount, bankReadyCount, teamMissingWaCount, teamOffOverdueCount] =
      await Promise.all([
        ["ADMIN", "ADVERTISER"].includes(user.role)
          ? db.requestDraft.count({
              where: user.role === "ADMIN" ? {} : { requesterId: user.id }
            })
          : Promise.resolve(0),
        ["ADMIN", "ADVERTISER"].includes(user.role)
          ? db.workRequest.count({
              where: {
                status: "BELUM",
                ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {})
              }
            })
          : Promise.resolve(0),
        db.workRequest.count({
          where:
            user.role === "ADMIN"
              ? {
                  OR: [
                    { status: { in: ["BELUM", "REVISI"] } },
                    { status: "DIKERJAKAN", deadlineAt: { lt: now } }
                  ]
                }
              : user.role === "CC"
                ? {
                    OR: [
                      { status: "BELUM" },
                      { creatorId: user.id, status: { in: ["REVISI", "DIKERJAKAN"] } }
                    ]
                  }
                : {
                    requesterId: user.id,
                    status: { not: "BERES" },
                    deadlineAt: { lt: now }
                  }
        }),
        ["ADMIN", "ADVERTISER"].includes(user.role)
          ? db.workRequest.count({
              where: {
                status: { in: ["SUDAH", "REVISI_DIKEMBALIKAN"] },
                ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {})
              }
            })
          : Promise.resolve(0),
        db.contentBank.count({
          where: {
            testStatus: "READY_TEST",
            ...(user.role === "ADVERTISER" ? { requesterId: user.id } : {}),
            ...(user.role === "CC" ? { creatorId: user.id } : {})
          }
        }),
        user.role === "ADMIN"
          ? db.user.count({
              where: {
                isActive: true,
                OR: [{ whatsappNumber: null }, { whatsappNumber: "" }]
              }
            })
          : Promise.resolve(0),
        user.role === "ADMIN"
          ? db.creatorStatusLog.count({
              where: {
                status: "OFF",
                endedAt: null,
                expectedUntil: { lt: now }
              }
            })
          : Promise.resolve(0)
      ]);

    return {
      ...emptyAlerts,
      request: draftCount + pendingEditableCount > 0,
      task: taskCount > 0,
      review: reviewCount > 0,
      bank: bankReadyCount > 0,
      team: teamMissingWaCount + teamOffOverdueCount > 0,
      settings: !user.whatsappNumber
    };
  } catch {
    return {
      ...emptyAlerts,
      settings: !user.whatsappNumber
    };
  }
}
