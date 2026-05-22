export interface AttendanceTemplateRenderContext {
  groupName: string;
  meetingDate: string;
  meetingTime: string;
  meetingAddress: string;
  attendanceList: string;
  adminEmail: string;
}

export type AttendanceTemplateToken =
  | "[groupName]"
  | "[meetingDate]"
  | "[meetingTime]"
  | "[meetingAddress]"
  | "[attendanceList]"
  | "[adminEmail]";

export type AttendanceTemplateReplacementMap = Record<
  AttendanceTemplateToken,
  string
>;

const ATTENDANCE_PLACEHOLDER_PATTERN = /\[([A-Za-z][A-Za-z0-9]*)\]/g;

export const buildAttendanceTemplateReplacementMap = (
  input: AttendanceTemplateRenderContext,
): AttendanceTemplateReplacementMap => ({
  "[groupName]": input.groupName,
  "[meetingDate]": input.meetingDate,
  "[meetingTime]": input.meetingTime,
  "[meetingAddress]": input.meetingAddress,
  "[attendanceList]": input.attendanceList,
  "[adminEmail]": input.adminEmail,
});

export const renderAttendanceTemplate = (
  template: string,
  replacements: AttendanceTemplateReplacementMap,
): string => {
  return template.replace(
    ATTENDANCE_PLACEHOLDER_PATTERN,
    (match, key: string) => {
      const token = `[${key}]` as AttendanceTemplateToken;
      return replacements[token] ?? match;
    },
  );
};
