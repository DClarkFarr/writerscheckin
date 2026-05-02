# Feature Specification: Avatar Menu Logout

**Feature Branch**: `004-pre-spec-branch`  
**Created**: 2026-05-01  
**Status**: Draft  
**Input**: User description: "in the top bar, when a user is logged in, instead of the current logout button, we should have the user's avatar. Clicking it produces a dropdown. It will have more links, but for now we'll just have the logout after the user info, email, etc. Follow shadcn patterns."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Access Account Menu from Avatar (Priority: P1)

As a logged-in user, I want to see my avatar in the top bar and open an account menu so that account actions are grouped in a predictable place.

**Why this priority**: This is the core behavior replacing the current top-bar logout button and is required for any account menu expansion.

**Independent Test**: Can be fully tested by signing in, confirming the avatar appears in the top bar, clicking the avatar, and verifying the account dropdown opens and closes correctly.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and viewing any page with the top bar, **When** the page loads, **Then** the top bar shows an avatar trigger instead of a standalone logout button.
2. **Given** a user is authenticated and the avatar is visible, **When** the user selects the avatar trigger, **Then** an account dropdown opens anchored to the avatar.
3. **Given** the account dropdown is open, **When** the user clicks outside the menu or presses Escape, **Then** the dropdown closes.

---

### User Story 2 - View Account Identity in Menu (Priority: P2)

As a logged-in user, I want to see my account identity details at the top of the dropdown so I can confirm which account is active before taking actions.

**Why this priority**: User identity context prevents mistakes and aligns with common account-menu patterns.

**Independent Test**: Can be tested by opening the avatar menu and verifying account identity content appears before action items.

**Acceptance Scenarios**:

1. **Given** the user opens the avatar menu, **When** the menu renders, **Then** the first section shows account identity information including display name and email.
2. **Given** a user profile image is unavailable, **When** the top bar renders, **Then** the avatar still renders with a deterministic fallback representation.

---

### User Story 3 - Log Out from Account Menu (Priority: P3)

As a logged-in user, I want to log out from the account dropdown so I can end my session from the same place as other account links.

**Why this priority**: Preserves existing logout capability while moving it into the new account-menu structure.

**Independent Test**: Can be tested by opening the avatar dropdown, selecting Logout, and confirming the session ends and post-logout navigation is correct.

**Acceptance Scenarios**:

1. **Given** the account dropdown is open, **When** the user selects Logout, **Then** the current authenticated session is terminated.
2. **Given** logout succeeds, **When** session termination completes, **Then** the user is redirected to the existing signed-out destination and can no longer access authenticated-only content without signing in again.

### Edge Cases

- The authenticated user object is temporarily unavailable during initial top-bar render; the interface should avoid showing both avatar and logout button at the same time.
- The user has no avatar image and no display name; the avatar fallback must still be visible and stable.
- The user opens the dropdown and immediately navigates to another page; menu state should not persist incorrectly.
- Logout fails due to a transient network issue; the user should remain signed in and receive clear feedback.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST replace the standalone top-bar logout button with an avatar-based account menu trigger for authenticated users.
- **FR-002**: System MUST display the account menu trigger only when a user is authenticated.
- **FR-003**: System MUST open an account dropdown when the authenticated user activates the avatar trigger.
- **FR-004**: System MUST display account identity information at the top of the dropdown, including user display name and email.
- **FR-005**: System MUST include a Logout action in the dropdown, positioned after the account identity section.
- **FR-006**: System MUST terminate the authenticated session when Logout is selected.
- **FR-007**: System MUST close the dropdown when the user dismisses it via outside interaction or keyboard escape.
- **FR-008**: System MUST provide an avatar fallback for users without a profile image.
- **FR-009**: System MUST preserve existing signed-out navigation behavior after logout.
- **FR-010**: System MUST structure the account dropdown so additional account links can be added later without changing the identity section or logout behavior.

### Key Entities _(include if feature involves data)_

- **Authenticated User Summary**: Represents the minimum account identity shown in the top bar and dropdown (display name, email, avatar source, fallback label).
- **Account Menu State**: Represents whether the account dropdown is open or closed and what trigger/context is currently active.
- **Session State**: Represents whether the current browser session is authenticated and the transition from authenticated to signed-out after logout.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of authenticated top-bar views show an avatar trigger and do not show the previous standalone logout button.
- **SC-002**: At least 95% of users in usability checks can locate and open the account menu within 5 seconds.
- **SC-003**: At least 95% of logout attempts initiated from the dropdown result in successful signed-out state transition within 3 seconds under normal conditions.
- **SC-004**: At least 90% of test participants correctly identify the active account from menu identity details before performing logout.

## Assumptions

- Existing authentication/session behavior remains unchanged except for where the logout action is accessed.
- The top bar is already present across authenticated pages and remains the single entry point for account actions.
- User profile data required for display (name, email, optional avatar source) is already available to the client in authenticated state.
- Initial scope includes only identity display and logout in the dropdown; additional account links are out of scope for this feature iteration.
