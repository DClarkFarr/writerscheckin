# Research: Meeting Invite Link Status and Recovery UX

## Decision 1: Resolve a typed invite-link access state instead of surfacing raw forbidden errors

- Decision: Introduce a normalized access-state resolution for invite-link loads with explicit outcomes: `pending_invite`, `not_invited`, `declined_or_left`, `removed`, `active_member`, and `unknown_or_expired`.
- Rationale: The spec requires status-aware messaging and actions for multiple user states, while replacing the generic forbidden experience.
- Alternatives considered:
  - Keep HTTP 403 and map one generic frontend message. Rejected because it fails status-specific guidance requirements.
  - Branch solely on status code families (403/404). Rejected because those codes do not carry enough state detail.

## Decision 2: Always return minimal group context for invite-link rendering

- Decision: For all non-active outcomes, include group name and group description in response payloads used by invite-link landing UI.
- Rationale: The spec requires group name and description to be visible in all cases.
- Alternatives considered:
  - Hide group metadata for unauthorized users. Rejected because it conflicts with required UX.
  - Provide only group name. Rejected because description visibility is also mandatory.

## Decision 3: Support direct accept/decline actions for pending invites

- Decision: Pending-invite state exposes Accept and Decline actions from the invite landing flow, each producing a deterministic post-action state.
- Rationale: This enables users to resolve blocked access in one flow and satisfies explicit status requirements.
- Alternatives considered:
  - Redirect users to a separate group-invite page. Rejected due to unnecessary friction and broken deep-link intent.
  - Accept-only action. Rejected because decline is an explicit requirement.

## Decision 4: Add rejoin request workflow for declined/left/removed outcomes

- Decision: Provide `Request to join` action for declined/left/removed states that triggers an email to the responsible group admin and includes requester identity/context.
- Rationale: The spec requires a recovery path and explicit admin notification behavior.
- Alternatives considered:
  - Display static “contact admin” text only. Rejected because actionable request submission is required.
  - Send rejoin requests to all group members. Rejected because target recipient must be responsible admin.

## Decision 5: Prevent repeated retry thrash on known authorization outcomes

- Decision: Treat known invite-link authorization outcomes as terminal UI states for query behavior (no repeated automatic refetch loops for the same unresolved state).
- Rationale: Current UX includes repeated retries and red forbidden surfaces; spec requires eliminating this behavior.
- Alternatives considered:
  - Keep default retry policy globally. Rejected because this flow is known to produce stable authorization outcomes.
  - Disable retries across all queries app-wide. Rejected due to unnecessary impact outside this flow.

## Decision 6: Membership lookup must use direct user+group lookup semantics

- Decision: Resolve access state using direct membership/invite lookup by `(groupId, userId)` semantics rather than paginated/list queries.
- Rationale: Repository guidance notes list-based checks can cause false negatives on large groups and unnecessary query cost.
- Alternatives considered:
  - Use list-by-group with limits. Rejected due to correctness risk and scalability issues.

## Decision 7: Preserve 404 vs 403 semantics while still providing user-facing context

- Decision: Keep backend semantic error classification (group/meeting existence vs authorization), while mapping resolved invite-link states to explicit UI messages and actions.
- Rationale: Preserves backend correctness and observability while meeting UX requirements.
- Alternatives considered:
  - Collapse all outcomes into a single HTTP response code. Rejected because it obscures diagnostics and state handling.
