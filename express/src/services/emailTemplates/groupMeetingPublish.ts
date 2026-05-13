import {
  buildBaseEmailTemplate,
  emailTypography,
  escapeHtml,
} from "./baseEmailTemplate";

export interface GroupMeetingPublishEmailInput {
  meetingName: string;
  occursAt: Date;
  publishMessage: string;
}

export interface GroupMeetingPublishEmailContent {
  subject: string;
  text: string;
  html: string;
}

export const buildGroupMeetingPublishEmail = (
  input: GroupMeetingPublishEmailInput,
): GroupMeetingPublishEmailContent => {
  const subject = `Meeting published: ${input.meetingName}`;
  const occursAtText = input.occursAt.toLocaleString();
  const message = input.publishMessage.trim();

  const text = [
    `A group meeting has been published: ${input.meetingName}`,
    `Scheduled for: ${occursAtText}`,
    message ? `Message: ${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = buildBaseEmailTemplate({
    previewText: `Meeting published: ${input.meetingName}`,
    heading: "Meeting Published",
    bodyHtml: [
      emailTypography.paragraph(
        `A group meeting has been published: <strong>${escapeHtml(input.meetingName)}</strong>.`,
      ),
      emailTypography.paragraph(`Scheduled for: ${escapeHtml(occursAtText)}.`),
      ...(message
        ? [emailTypography.paragraph(`Message: ${escapeHtml(message)}`)]
        : []),
    ].join(""),
  });

  return {
    subject,
    text,
    html,
  };
};
