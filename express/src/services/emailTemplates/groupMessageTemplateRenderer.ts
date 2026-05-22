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

const PLACEHOLDER_PATTERN = /\[([A-Za-z][A-Za-z0-9]*)\]/g;

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
  const orderedEntries: Array<[GroupTemplateToken, string]> = TOKEN_ORDER.map(
    (token) => [token, replacements[token]],
  );
  const replacementLookup = new Map<string, string>(orderedEntries);

  return template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const token = `[${key}]` as GroupTemplateToken;
    return replacementLookup.get(token) ?? match;
  });
};
