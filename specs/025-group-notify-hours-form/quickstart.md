# Quickstart: Group Notify Hours Before Form Field

**Branch**: `025-group-notify-hours-form`

## Prerequisites

- Node.js and npm installed
- MongoDB running (local or Atlas)
- `.env.local` configured with valid `MONGO_URL`, `SESSION_SECRET`, etc.
- Both `express/` and `web/` dev servers running

## Start Dev Servers

```bash
# Terminal 1 — API server
cd express
npm run dev

# Terminal 2 — Frontend
cd web
npm run dev
```

## Manual Testing Walkthrough

### Verify the new field appears in the group form

1. Log in as a group owner.
2. Navigate to a group's edit page: `http://localhost:5173/groups/<groupId>/edit`
3. Scroll to the **scheduling section**.
4. Confirm the layout is **two rows of two columns**:
   - Row 1: **Start Time** | **Duration (minutes)**
   - Row 2: **Check-In Closes (hours before start)** | **Notify Attendance Hours Before**
5. Confirm the "Notify Attendance Hours Before" input is pre-populated with the group's current value.

### Update the field and verify inheritance

1. Change "Notify Attendance Hours Before" to `3`.
2. Click **Save Group** (or equivalent).
3. Navigate to the group and create a new upcoming meeting from defaults.
4. Open the meeting's edit view.
5. Confirm the meeting's **Notify Attendance Hours Before** field shows `3`.

### Verify zero is accepted

1. Set "Notify Attendance Hours Before" to `0`.
2. Save. Confirm no validation error.

### Verify negative is rejected

1. Set "Notify Attendance Hours Before" to `-1`.
2. Blur the field or attempt to save. Confirm an inline validation error appears.

## TypeScript Compilation Check

```bash
# Frontend
cd web && npx tsc --noEmit

# Backend
cd express && npx tsc --noEmit
```

Both should compile with zero errors after implementing the changes.
