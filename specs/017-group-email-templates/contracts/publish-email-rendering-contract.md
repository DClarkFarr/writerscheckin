# Contract: Publish Email Template Rendering

## Purpose

Define how meeting `publishEmailMessage` template content is parsed into final email body and how check-in CTA is injected.

## Scope

- Layer: email template builder used in meeting publish notifications.
- Input source: meeting-level `publishEmailMessage` (inherited from group by default, editable per meeting).

## Supported placeholders

- `[meetingName]`
- `[meetingDate]`
- `[meetingTime]`
- `[meetingAddress]`
- `[dateOfNotification]`
- `[checkinButton]`

## Render input contract

```ts
interface PublishEmailTemplateContext {
  meetingName: string;
  meetingDateText: string;
  meetingTimeText: string;
  meetingAddress: string;
  dateOfNotificationText: string;
  meetingUrl: string;
  publishMessageHtml: string;
}
```

## Render output contract

```ts
interface GroupMeetingPublishEmailContent {
  subject: string;
  text: string;
  html: string;
}
```

## Rendering rules

1. Use meeting `publishEmailMessage` as the primary body template.
2. Replace supported placeholders with context values at send time.
3. Replace `[checkinButton]` with themed CTA button HTML labeled `check in` and linked to `meetingUrl`.
4. Ensure `text` output contains readable check-in link fallback.
5. Leave unsupported placeholders unchanged.

## Safety rules

- Escape dynamic values before HTML insertion unless intentionally trusted sanitized rich text.
- Preserve HTML compatibility from rich text source without double-escaping editor markup.

## Ordering requirement

- Check-in button appears after the main text body section in final email output.
