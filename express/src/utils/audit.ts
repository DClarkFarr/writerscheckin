export type AuditAction =
  | "signup"
  | "login"
  | "logout"
  | "reset-request"
  | "reset-confirm";

export interface AuditEvent {
  action: AuditAction;
  userId?: string;
  email?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export const recordAuditEvent = (event: AuditEvent): void => {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  console.info("AUDIT", payload);
};
