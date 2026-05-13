# Feature Specification: Group Email Templates

**Feature Branch**: `[017-create-feature-branch]`  
**Created**: 2026-05-12  
**Status**: Draft  
**Input**: User description: "as a group admin, i should have message templates automatically populate in my group form, if none exist.

These templates should have placeholders such as [location] and [address] and [meetingTime] which will be replaced with correct data at the time the emails are sent.

Group meetings should inherit the template from the group, and i should be able to edit them, with the same shortcodes.

When the email is sent, it should parse the template as the main text body.

Then, after that, there should be a big themed button that says 'check in' that will take the user to the url of the meeting in question"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Auto-Seed Group Templates (Priority: P1)

As a group admin, I can open a group messaging form and see default template content automatically populated when no templates exist yet, so I can start publishing meetings quickly without writing copy from scratch.

**Why this priority**: This is the entry point for the feature and provides immediate value for first-time setup.

**Independent Test**: Can be fully tested by creating a group with no existing templates, opening the group form, and verifying defaults are present and editable.

**Acceptance Scenarios**:

1. **Given** a group has no saved message templates, **When** a group admin opens the group messaging form, **Then** default template text is auto-populated.
2. **Given** a group already has saved message templates, **When** a group admin opens the group messaging form, **Then** existing templates are shown and auto-seeding does not overwrite them.

---

### User Story 2 - Inherit and Edit Meeting Templates (Priority: P2)

As a group admin, I can create or edit a group meeting that starts with the group template and then adjust meeting-specific wording while keeping shortcode support.

**Why this priority**: Meeting-level customization is required for real event communication while preserving consistency.

**Independent Test**: Can be fully tested by creating a group template, creating a meeting, confirming inheritance, editing meeting text, and saving without changing the group-level source template.

**Acceptance Scenarios**:

1. **Given** a group template exists, **When** a group admin creates a new meeting, **Then** the meeting message starts with the group template content.
2. **Given** a meeting message is inherited, **When** a group admin edits the meeting message and saves, **Then** the meeting stores its updated text and the group template remains unchanged.
3. **Given** shortcode tokens such as [location], [address], and [meetingTime] appear in the template, **When** a group admin edits and saves text, **Then** those tokens remain valid placeholders.

---

### User Story 3 - Render Parsed Email with Check-In Button (Priority: P3)

As a meeting invitee, I receive an email where the message body is generated from the saved template with placeholders replaced by meeting data, followed by a prominent themed "check in" button that opens the meeting URL.

**Why this priority**: Email output quality determines recipient clarity and successful attendance/check-ins.

**Independent Test**: Can be fully tested by sending a meeting publish email from a template containing shortcodes and verifying resolved text plus button destination in both preview and delivered email.

**Acceptance Scenarios**:

1. **Given** a meeting template includes [location], [address], and [meetingTime], **When** a publish email is sent, **Then** each shortcode is replaced with the matching meeting value in the email body.
2. **Given** a publish email is generated, **When** the recipient views the email, **Then** a visually prominent themed button labeled "check in" appears after the message body.
3. **Given** the recipient clicks the "check in" button, **When** navigation occurs, **Then** the recipient is taken to the URL of that specific meeting.

---

### Edge Cases

- A template contains an unsupported shortcode token; the system should leave unsupported tokens unchanged and still send the email.
- A supported shortcode has missing source data (for example, no address); the system should substitute a safe fallback value and avoid broken formatting.
- A group template is empty or whitespace-only; the system should prevent publishing with empty content and provide a clear correction prompt.
- The meeting URL is unavailable at send time; the system should fail gracefully with a clear error state rather than sending a broken check-in button.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST auto-populate default group message templates when a group admin opens a group form and no templates currently exist.
- **FR-002**: System MUST NOT overwrite existing group templates during form load when templates already exist.
- **FR-003**: System MUST provide default template content that includes shortcode placeholders for [location], [address], and [meetingTime].
- **FR-004**: System MUST allow group admins to edit and save group-level templates.
- **FR-005**: System MUST initialize new group meeting messages from the current group template.
- **FR-006**: System MUST allow group admins to edit meeting-level message templates without mutating the group-level template.
- **FR-007**: System MUST support shortcode parsing for [location], [address], and [meetingTime] at email send time using meeting-specific values.
- **FR-008**: System MUST use the parsed template output as the primary email body text for group meeting publish emails.
- **FR-009**: System MUST append a prominent themed button labeled "check in" after the main email body content.
- **FR-010**: System MUST configure the "check in" button destination to the URL of the corresponding meeting.
- **FR-011**: System MUST preserve backwards compatibility for emails sent from meetings that already have custom message text.
- **FR-012**: System MUST handle unresolved or missing shortcode data with user-safe fallback behavior that does not break email delivery.

### Key Entities _(include if feature involves data)_

- **Group Template**: The reusable message template stored at group scope, including editable body text and supported shortcode tokens.
- **Meeting Template**: The meeting-scoped message body initialized from the group template but independently editable for a specific meeting.
- **Shortcode Token**: A placeholder token (for example, [location], [address], [meetingTime]) that maps to meeting data at send time.
- **Publish Email Content**: The final message generated for recipients, consisting of parsed template text plus a themed check-in call-to-action linked to the meeting URL.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of first-time group admins can prepare a publish-ready template in under 2 minutes without external help.
- **SC-002**: 100% of publish emails for meetings with supported shortcodes contain resolved values for [location], [address], and [meetingTime] when corresponding meeting data exists.
- **SC-003**: 100% of publish emails include a visible "check in" button that links to the correct meeting URL.
- **SC-004**: In usability validation, at least 90% of recipients can identify the meeting details and check-in action from the email in under 10 seconds.

## Assumptions

- Group admins are the only role authorized to create or edit group and meeting message templates.
- Existing meeting URLs are already generated and available before publish emails are sent.
- The themed button style follows the product's existing email visual design standards.
- Shortcode parsing scope for this feature is limited to [location], [address], and [meetingTime].
- Existing email delivery infrastructure remains unchanged; only message composition behavior is expanded.
