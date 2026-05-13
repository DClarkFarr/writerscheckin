# Quickstart: Group Email Templates and Check-In UX

## Implementation order

1. Add default template constants for group-level `publishEmailMessage` and `attendanceEmailMessage` in backend service scope.
2. Update group query/read service flow to backfill and persist defaults only when missing, so website queries always return editable template values.
3. Confirm/create meeting-from-group flow continues inheriting template fields from group records.
4. Convert group form template fields to rich text editing using existing `RichTextEditor` pattern and preserve hook/component separation.
5. Convert meeting form template fields (`publishEmailMessage`, `attendanceEmailMessage`) to rich text editing with autosave compatibility.
6. Extend publish email template builder to parse shortcodes from meeting `publishEmailMessage` and render resolved main body output.
7. Replace `[checkinButton]` token with a large themed CTA button linked to the meeting URL in HTML output; include readable fallback in text output.
8. Add check-in UI to meeting details page reusing the same check-in pattern used by meeting card behavior and existing check-in mutation flow.
9. Verify mapping compatibility for group API fields currently surfaced as `publicMessage`/`attendanceMessage` aliases.

## Default Template Values

### attendanceEmailMessage

```text
TODO: add template here
```

### publishEmailMessage

```text
Good morning my author friends!

This is a reminder about our [meetingName] on [meetingDate] at [meetingTime] at [meetingAddress].

Please RSVP if you plan to attend AND if you have pages to read.
(Even if you're not reading, we need an accurate headcount to know how many copies to bring)

[checkinButton]

<b>*To ensure your reservation, please respond to this email no later than 5pm [dateOfNotification]. </b>

If we have more than six readers, this will allow us to reserve a second room in advance.

Warmly,

Administrator Name here
```

## Supported Shortcodes

- `[meetingName]`
- `[meetingDate]`
- `[meetingTime]`
- `[meetingAddress]`
- `[dateOfNotification]`
- `[checkinButton]`

## Defaulting Behavior

- Group read/query flows now backfill `publishEmailMessage` and `attendanceEmailMessage` when missing or empty.
- Existing non-empty template values are preserved and never overwritten by the defaulting pass.
- Meeting creation from group defaults inherits resolved group templates.

## Verification checklist

1. Group query returns non-empty template fields after first read of records that were missing values.
2. Existing non-empty group template values are not overwritten.
3. Group form template fields render rich text editor and save HTML-compatible content.
4. Meeting form template fields render rich text editor and autosave updates.
5. New meeting inherits template values from group defaults.
6. Meeting template edits do not modify group template values.
7. Publish email resolves all supported shortcodes in body output.
8. Publish email contains a prominent themed check-in button linking to the correct meeting URL.
9. Meeting details page exposes check-in actions that match meeting card behavior and state handling.

## Suggested validation commands

```bash
cd express && npm run build
cd web && npx tsc --noEmit
```

## Manual checks

1. Open an existing group with blank template values and verify defaults appear, then refresh and verify persisted values remain.
2. Create a new meeting from group defaults, edit meeting template fields, and verify group-level values remain unchanged.
3. Send/preview publish email for a meeting containing all placeholders and verify resolved content plus CTA button URL.
4. Open meeting details page and perform each check-in option; verify counts/state refresh consistently with meeting card flow.

## Validation outcomes (2026-05-12)

1. Completed: `cd express && npm run build`.
2. Completed: `cd web && npx tsc --noEmit`.
3. Pending manual check: seed/open group with blank templates and verify read-time default backfill persistence.
4. Pending manual check: verify meeting edit rich-text template autosave and inheritance behavior.
5. Pending manual check: verify publish email shortcode rendering and check-in button destination.
6. Pending manual check: verify details-page check-in controls update counts/status after mutation.
