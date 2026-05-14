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

export interface GroupReinviteRequestEmailInput {
  adminName: string;
  requesterEmail: string;
  groupId: string;
  groupName: string;
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
        false,
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

export const buildGroupReinviteRequestEmail = ({
  adminName,
  requesterEmail,
  groupId,
  groupName,
}: GroupReinviteRequestEmailInput): GroupInviteEmailContent => {
  const safeAdminName = adminName.trim().length > 0 ? adminName : "Admin";
  const safeRequesterEmail = requesterEmail.trim();
  const safeGroupName = groupName.trim().length > 0 ? groupName : "this group";
  const editGroupUrl = emailLinks.editGroup(groupId);

  const subject = `${safeRequesterEmail} requested a new group invite`;

  const text = [
    `Hello ${safeAdminName},`,
    "",
    `The user with this email address: ${safeRequesterEmail} has requested to be invited to the group ${safeGroupName}.`,
    `Group admin link: ${editGroupUrl}`,
    "",
    "Please issue them a new invite or reply with your reasoning to the contrary.",
    "",
    "Thanks,",
    "",
    "Team WritersCheck.In",
  ].join("\n");

  const html = buildBaseEmailTemplate({
    previewText: `${safeRequesterEmail} requested an invite to ${safeGroupName}`,
    heading: "New Group Invite Request",
    bodyHtml: [
      emailTypography.paragraph(`Hello ${escapeHtml(safeAdminName)},`),
      emailTypography.paragraph(
        `The user with this email address: <b>${escapeHtml(safeRequesterEmail)}</b> has requested to be invited to the group <a href=\"${escapeHtml(editGroupUrl)}\">${escapeHtml(safeGroupName)}</a>.`,
      ),
      emailTypography.paragraph(
        "Please issue them a new invite or reply with your reasoning to the contrary.",
      ),
      emailTypography.paragraph("Thanks,"),
      emailTypography.paragraph("Team WritersCheck.In"),
    ].join(""),
  });

  return {
    subject,
    text,
    html,
  };
};
