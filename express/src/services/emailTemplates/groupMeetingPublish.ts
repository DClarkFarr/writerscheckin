import {
  buildBaseEmailTemplate,
  emailComponents,
  emailTypography,
  escapeHtml,
} from "./baseEmailTemplate";
import {
  buildGroupTemplateReplacementMap,
  renderGroupTemplate,
} from "./groupMessageTemplateRenderer";

import dayjs from "dayjs";

export interface GroupMeetingPublishEmailInput {
  meetingName: string;
  occursAt: Date;
  meetingAddress: string;
  meetingUrl: string;
  publishMessage: string;
  notifyAttendanceHoursBefore: number;
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
  const meetingDateText = input.occursAt.toLocaleDateString();
  const meetingTimeText = input.occursAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateOfNotificationText = dayjs(input.occursAt)
    .subtract(input.notifyAttendanceHoursBefore ?? 24, "hour")
    .toDate()
    .toLocaleString();

  const messageTemplate = input.publishMessage.trim();

  const checkinButtonHtml = emailComponents.button(
    "Check-In on WritersCheck.in",
    input.meetingUrl,
    true,
  );

  const renderedHtmlTemplate = renderGroupTemplate(
    messageTemplate,
    buildGroupTemplateReplacementMap({
      meetingName: escapeHtml(input.meetingName),
      meetingDate: escapeHtml(meetingDateText),
      meetingTime: escapeHtml(meetingTimeText),
      meetingAddress: escapeHtml(input.meetingAddress),
      dateOfNotification: escapeHtml(dateOfNotificationText),
      checkinButton: checkinButtonHtml,
    }),
  );

  const renderedTextTemplate = renderGroupTemplate(
    messageTemplate,
    buildGroupTemplateReplacementMap({
      meetingName: input.meetingName,
      meetingDate: meetingDateText,
      meetingTime: meetingTimeText,
      meetingAddress: input.meetingAddress,
      dateOfNotification: dateOfNotificationText,
      checkinButton: `Check in: ${input.meetingUrl}`,
    }),
  )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();

  const text = [
    renderedTextTemplate,
    renderedTextTemplate.includes("Check in:")
      ? ""
      : `Check in: ${input.meetingUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = buildBaseEmailTemplate({
    previewText: `Check-in available for meeting: ${input.meetingName}`,
    heading: "Join our next meeting",
    bodyHtml: [
      emailTypography.paragraph(
        `Group Name: <strong>${escapeHtml(input.meetingName)}</strong>.`,
      ),
      renderedHtmlTemplate,
      messageTemplate.includes("[checkinButton]")
        ? ""
        : emailComponents.button("check in", input.meetingUrl, true),
    ].join(""),
  });

  return {
    subject,
    text,
    html,
  };
};
