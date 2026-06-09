export type NavAlertKey =
  | "dashboard"
  | "request"
  | "task"
  | "review"
  | "bank"
  | "materials"
  | "products"
  | "reports"
  | "team"
  | "settings";

export type NavAlerts = Record<NavAlertKey, boolean>;
