import {
  buildBaseEmailTemplate,
  emailTypography,
  escapeHtml,
} from "./baseEmailTemplate";
import {
  buildAttendanceTemplateReplacementMap,
  renderAttendanceTemplate,
} from "./groupAttendanceTemplateRenderer";

export interface AttendanceListEntry {
  name: string;
  email: string;
  status: string;
}

export interface GroupMeetingAttendanceEmailInput {
  groupName: string;
  occursAt: Date;
  meetingAddress: string;
  attendanceMessage: string;
  adminEmail: string;
  attendanceEntries: AttendanceListEntry[];
}

export interface GroupMeetingAttendanceEmailContent {
  subject: string;
  text: string;
  html: string;
}

const buildAttendanceListHtml = (entries: AttendanceListEntry[]): string => {
  if (entries.length === 0) {
    return emailTypography.muted("No RSVPs yet.", true);
  }

  const rows = entries
    .map(
      (entry) =>
        `<tr>` +
        `<td style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top;\">` +
        `<div style=\"font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.4;\">${escapeHtml(entry.name)}</div>` +
        `<div style=\"font-size: 12px; color: #475569; line-height: 1.4;\">${escapeHtml(entry.email)}</div>` +
        `</td>` +
        `<td align=\"right\" style=\"padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap;\">${escapeHtml(entry.status)}</td>` +
        `</tr>`,
    )
    .join("");

  return [
    `<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin: 0 0 18px;\">`,
    rows,
    `</table>`,
  ].join("");
};

const buildAttendanceListText = (entries: AttendanceListEntry[]): string => {
  if (entries.length === 0) {
    return "No RSVPs yet.";
  }

  return entries
    .map((entry) => `- ${entry.name} <${entry.email}>: ${entry.status}`)
    .join("\n");
};

export const buildGroupMeetingAttendanceEmail = (
  input: GroupMeetingAttendanceEmailInput,
): GroupMeetingAttendanceEmailContent => {
  const subject = `Meeting attendance update: ${input.groupName}`;
  const meetingDateText = input.occursAt.toLocaleDateString();
  const meetingTimeText = input.occursAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const messageTemplate = input.attendanceMessage.trim();
  const attendanceListHtml = buildAttendanceListHtml(input.attendanceEntries);
  const attendanceListText = buildAttendanceListText(input.attendanceEntries);

  const renderedHtmlTemplate = renderAttendanceTemplate(
    messageTemplate,
    buildAttendanceTemplateReplacementMap({
      groupName: escapeHtml(input.groupName),
      meetingDate: escapeHtml(meetingDateText),
      meetingTime: escapeHtml(meetingTimeText),
      meetingAddress: escapeHtml(input.meetingAddress),
      attendanceList: attendanceListHtml,
      adminEmail: escapeHtml(input.adminEmail),
    }),
  );

  const renderedTextTemplate = renderAttendanceTemplate(
    messageTemplate,
    buildAttendanceTemplateReplacementMap({
      groupName: input.groupName,
      meetingDate: meetingDateText,
      meetingTime: meetingTimeText,
      meetingAddress: input.meetingAddress,
      attendanceList: attendanceListText,
      adminEmail: input.adminEmail,
    }),
  )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();

  const html = buildBaseEmailTemplate({
    previewText: `Attendance update for ${input.groupName}`,
    heading: "Meeting attendance update",
    bodyHtml: renderedHtmlTemplate,
  });

  return {
    subject,
    text: renderedTextTemplate,
    html,
  };
};
