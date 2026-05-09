import {
  buildBaseEmailTemplate,
  emailLinks,
  emailTypography,
  escapeHtml,
} from "./baseEmailTemplate";

export interface GroupInviteEmailContent {
  subject: string;
  text: string;
  html: string;
}

export const buildGroupInviteEmail = (
  membershipId: string,
  inviteToken: string,
): GroupInviteEmailContent => {
  const subject = "You've been invited to a writers group";
  const joinUrl = emailLinks.joinGroup(membershipId, inviteToken);

  const text = [
    "You've been invited to join a writers group on Writers CheckIn.",
    `Accept your invitation by clicking the following link: ${joinUrl}`,
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
        `Accept your invitation by clicking the following link: `,
      ),
      emailTypography.codeLink("https://writerscheckin.com/join", joinUrl),
      emailTypography.paragraph(
        "Sign in or create an account to accept your invitation.",
      ),

      emailTypography.muted(
        `If the above link doesn't work, copy and paste the following URL into your browser:<br><small>${escapeHtml(joinUrl)}</small>`,
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
