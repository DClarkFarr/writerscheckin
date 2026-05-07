import { buildBaseEmailTemplate, emailTypography } from "./baseEmailTemplate";

export interface GroupInviteEmailContent {
  subject: string;
  text: string;
  html: string;
}

export const buildGroupInviteEmail = (): GroupInviteEmailContent => {
  const subject = "You've been invited to a writers group";

  const text = [
    "You've been invited to join a writers group on Writers CheckIn.",
    "Sign in or create an account to accept your invitation.",
  ].join("\n");

  const html = buildBaseEmailTemplate({
    previewText: "You've been invited to join a writers group.",
    heading: "Writers Group Invitation",
    bodyHtml: [
      emailTypography.paragraph(
        "You've been invited to join a writers group on Writers CheckIn.",
      ),
      emailTypography.paragraph(
        "Sign in or create an account to accept your invitation.",
      ),
      emailTypography.muted(
        "If you were not expecting this invite, you can safely ignore this email.",
      ),
    ].join(""),
  });

  return {
    subject,
    text,
    html,
  };
};
