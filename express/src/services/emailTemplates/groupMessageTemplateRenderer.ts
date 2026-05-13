export interface GroupTemplateRenderContext {
  meetingName: string;
  meetingDate: string;
  meetingTime: string;
  meetingAddress: string;
  dateOfNotification: string;
  checkinButton: string;
}

export type GroupTemplateToken =
  | "[meetingName]"
  | "[meetingDate]"
  | "[meetingTime]"
  | "[meetingAddress]"
  | "[dateOfNotification]"
  | "[checkinButton]";

export type GroupTemplateReplacementMap = Record<GroupTemplateToken, string>;

const TOKEN_ORDER: GroupTemplateToken[] = [
  "[meetingName]",
  "[meetingDate]",
  "[meetingTime]",
  "[meetingAddress]",
  "[dateOfNotification]",
  "[checkinButton]",
];

export const buildGroupTemplateReplacementMap = (
  input: GroupTemplateRenderContext,
): GroupTemplateReplacementMap => ({
  "[meetingName]": input.meetingName,
  "[meetingDate]": input.meetingDate,
  "[meetingTime]": input.meetingTime,
  "[meetingAddress]": input.meetingAddress,
  "[dateOfNotification]": input.dateOfNotification,
  "[checkinButton]": input.checkinButton,
});

export const renderGroupTemplate = (
  template: string,
  replacements: GroupTemplateReplacementMap,
): string => {
  let rendered = template;
  for (const token of TOKEN_ORDER) {
    rendered = rendered.split(token).join(replacements[token]);
  }
  return rendered;
};
