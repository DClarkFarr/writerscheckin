# Feature Specification: My Groups Pagination

**Feature Branch**: `009-query-hook-updates`  
**Created**: 2026-05-03  
**Status**: Draft  
**Input**: User description: "as a user, i should be able to load my groups in a paginated infinite scrolling manner in the 'my groups' page.

1. The groups response endpoint should return group documents only with member count and not the respective members. After clicking on a group and viewing it or editing it, then a separate query should load the members.

2. It should load the group members in batches of twenty with a 'load more' button.

3. Below the members section there should be an additional section for meetings that should be loaded from recent to oldest. they should also be loaded in batches of twenty with a 'load more meetings' button after the list."

## Clarifications

### Session 2026-05-03

- Q: Which pagination mechanism should members and meetings use? → A: Cursor-based pagination with nextCursor.
- Q: Which meetings should be returned by default in group detail contexts? → A: Members see published meetings only; owner/admin roles see all non-deleted meetings.
- Q: What should meetings cursor pagination be based on? → A: `occursAt` with `_id` as deterministic tie-breaker.
- Q: What should member pagination cursor ordering be based on? → A: `role` (owner, admin, member), then `name` (or `email` when name is unavailable) alphabetically, then `_id`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse My Groups Incrementally (Priority: P1)

As an authenticated user, I can browse my groups on the My Groups page in an infinite-scrolling experience that loads results in pages instead of loading all groups at once.

**Why this priority**: This is the primary discovery and navigation flow for group management and directly impacts perceived performance and usability.

**Independent Test**: Can be fully tested by opening My Groups, scrolling through multiple pages of results, and confirming additional groups load incrementally without requiring a full page refresh.

**Acceptance Scenarios**:

1. **Given** I have more groups than fit in the initial page, **When** I open My Groups and scroll toward the end of loaded results, **Then** the next page of groups is loaded and appended in sequence.
2. **Given** I have no groups, **When** I open My Groups, **Then** I see an empty state and no loading loop occurs.
3. **Given** a group list page is returned, **When** groups are displayed in My Groups, **Then** each group entry includes summary information and member count only, without the full member list.

---

### User Story 2 - Load Members On Demand (Priority: P2)

As a user viewing or editing a specific group, I can load group members only after opening that group, and I can fetch additional members in batches of 20 with a Load More control.

**Why this priority**: Deferring member retrieval reduces unnecessary data transfer for users who only browse group summaries, while preserving full detail access when needed.

**Independent Test**: Can be fully tested by opening a group from My Groups, confirming members are fetched only after entering the group view/edit context, and repeatedly using Load More to retrieve additional 20-member batches.

**Acceptance Scenarios**:

1. **Given** I am on My Groups list view, **When** I have not opened a specific group, **Then** no full member roster for any group is loaded.
2. **Given** I open a specific group for viewing or editing, **When** the group detail context loads, **Then** the first batch of members is shown.
3. **Given** more than 20 members exist for the opened group, **When** I select Load More in the members section, **Then** the next 20 members are appended without removing already visible members.

---

### User Story 3 - Review Group Meetings Chronologically (Priority: P3)

As a user viewing a specific group, I can review meetings in a dedicated section below members, ordered from most recent to oldest, and load additional meetings in batches of 20.

**Why this priority**: Meeting history is essential context for active groups but is secondary to basic group discovery and member management.

**Independent Test**: Can be fully tested by opening a group, confirming meeting items are ordered newest first in the meetings section, and using Load More Meetings to append additional 20-item batches in chronological order.

**Acceptance Scenarios**:

1. **Given** I am viewing a group detail screen, **When** meetings are displayed, **Then** the meetings section appears below the members section.
2. **Given** meetings exist for the group, **When** the initial meetings batch is loaded, **Then** items are sorted from newest to oldest.
3. **Given** more than 20 meetings exist, **When** I select Load More Meetings, **Then** the next 20 older meetings are appended after the existing list.

---

### Edge Cases

- A group has exactly 20 members or 20 meetings; the corresponding Load More control is not shown after the first batch.
- A user scrolls quickly and triggers multiple pagination requests; duplicate group entries are not displayed.
- A selected group is deleted or access is revoked between list load and detail load; the user sees a clear not-available state.
- A members or meetings batch request fails after prior batches loaded; previously loaded items remain visible and retry is possible.
- A group has no meetings; the meetings section still renders with an explicit empty state below members.
- A user with `member` role does not receive draft meetings in paginated meeting responses.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide paginated retrieval of the authenticated user's groups for the My Groups page.
- **FR-002**: The My Groups experience MUST support infinite scrolling that appends subsequent group pages as the user reaches the end of currently loaded results.
- **FR-003**: Group records returned for My Groups MUST include member count and group summary fields, and MUST NOT include full member rosters.
- **FR-004**: The system MUST retrieve full group members only after a user opens an individual group in view or edit context.
- **FR-005**: The group members section MUST load members in batches of 20 items per request using cursor-based pagination.
- **FR-006**: The group members section MUST provide a Load More control when additional member batches are available.
- **FR-007**: The group detail experience MUST include a meetings section positioned below the members section.
- **FR-008**: Meetings for a group MUST be presented from most recent to oldest.
- **FR-009**: The meetings section MUST load meetings in batches of 20 items per request using cursor-based pagination.
- **FR-010**: The meetings section MUST provide a Load More Meetings control when additional meeting batches are available.
- **FR-011**: The system MUST preserve already loaded groups, members, and meetings when loading additional batches.
- **FR-012**: The system MUST present explicit empty states for groups, members, and meetings when no records exist.
- **FR-013**: The system MUST present recoverable error feedback when any page/batch load fails, without clearing previously loaded items.
- **FR-014**: Group, member, and meeting pagination responses MUST use a consistent cursor token contract (`nextCursor`), where `null` indicates no additional pages.
- **FR-015**: Meeting visibility MUST be role-based: users with `member` role receive published meetings only, while users with `owner` or `admin` roles receive all non-deleted meetings.
- **FR-016**: Meeting cursor pagination MUST be ordered and paged by `occursAt` (newest to oldest) with `_id` as the deterministic tie-breaker for records with equal occurrence timestamps.
- **FR-017**: Member pagination MUST be ordered by role priority (`owner`, `admin`, `member`), then by `name` alphabetically (falling back to `email` when name is unavailable), then by `_id` as the deterministic tie-breaker.

### Key Entities

- **Group Summary**: A lightweight group representation shown in My Groups, including identifiers, display metadata, and total member count.
- **Group Member Batch**: A paginated subset of members for a specific group, containing up to 20 members and pagination state indicating whether more members are available.
- **Group Meeting Batch**: A paginated subset of meetings for a specific group, containing up to 20 meetings sorted newest-to-oldest and pagination state indicating whether more meetings are available.
- **Group Detail View Context**: The user state when a single group is opened for viewing or editing, which enables member and meeting batch loading.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of users can reach and view additional groups on My Groups by scrolling, without manual page refresh.
- **SC-002**: 100% of group entries shown on My Groups exclude full member rosters while still showing member counts.
- **SC-003**: 95% of users can load at least one additional member batch and one additional meeting batch for an opened group using the provided controls.
- **SC-004**: In usability validation, at least 90% of participants correctly identify that meetings are listed newest-first and located below members.

## Assumptions

- Users accessing My Groups are authenticated and authorized to view only their own groups.
- Existing group view and group edit flows remain the entry points for loading full member and meeting details.
- Pagination state for groups, members, and meetings uses a shared cursor token (`nextCursor`) contract.
- Responsive behavior for mobile and desktop follows current application standards and is in scope for this feature.
