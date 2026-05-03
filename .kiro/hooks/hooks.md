# ConnectFlight — Hooks

## Hooks Used in This Project

Kiro hooks were used to automate repetitive checks during development.

### 1. Lint on File Save

- **Event:** `fileEdited` on `*.jsx`, `*.ts`, `*.tsx`
- **Action:** Remind the agent to check for unused variables and broken imports after every code edit
- **Why:** Caught issues like the unused `params` variable in `buildGoogleFlightsUrl` and the unused `buildGoogleFlightsSearchUrl` function before they accumulated

```json
{
  "name": "Lint on Save",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["*.jsx", "*.tsx", "*.ts"]
  },
  "then": {
    "type": "runCommand",
    "command": "npm run lint"
  }
}
```

### 2. JSON Validation on Airport File Edit

- **Event:** `fileEdited` on `**/airports.json`
- **Action:** Remind the agent to verify JSON syntax and consistent field naming (`code` vs `id`) after any airport data change
- **Why:** Directly prevented the blank-page bug caused by a malformed SBP entry using `id` instead of `code`

```json
{
  "name": "Validate Airport JSON",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["**/airports.json"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Verify the airports.json file has valid JSON syntax and all entries use the 'code' field (not 'id') for the IATA code."
  }
}
```

## Development Rules Enforced via Hooks

- No unused variables left in committed code
- Airport JSON entries must use `code` in the frontend file and `id` in the backend file
- All new UI buttons must include `rel="noopener noreferrer"` when opening external links
- Google Flights deep-links must prefer `booking_token` when available, with a route/date fallback

## Development Patterns

### Shared Components
- `AirportInput` was originally inline in `App.jsx`. Once it was needed in `ConnectionsPage.jsx`, it was extracted to `components/AirportInput.jsx` and imported in both places. This is the pattern for any component used in more than one file.

### Context for Cross-Page State
- `SearchContext` — persists the flight search form state (from, to, date, priority, results) so switching to the Connections page and back doesn't lose the search.
- `ContactsContext` — holds the contacts list and exposes `addContact`, `removeContact`, `updateContact`. Both the Connections page and the flight results page (`ConnectionInsight`) read from this context.

### Backend Isolation
- The backend is never modified for frontend-only features. If a feature requires new data, it's either derived from existing API responses or stored client-side.
- The `normalizeLayovers` function in `App.jsx` transforms raw SerpAPI layover objects into the shape the UI needs — this transformation lives in the frontend, not the backend.

### Airport Matching (Three-Tier)
When matching a contact's city to a flight layover:
1. Check if the airport string contains the contact city (e.g. "Phoenix Sky Harbor" contains "Phoenix")
2. Look up the IATA code in `airports.json` to get the canonical city name (e.g. MNL → "Manila")
3. Extract significant words from the airport name (strip "International", "Airport", etc.) and check against contact city

This handles edge cases like "Ninoy Aquino International Airport (MNL)" matching a contact in "Manila".

### Form Space Key Fix
Forms using `AirportInput` inside a `<form>` element had the space key swallowed by the browser activating the focused submit button. Fixed by:
1. Converting `<form>` to `<div>` in the contacts forms
2. Changing all submit buttons to `type="button"` with explicit `onClick` handlers
3. Adding `e.stopPropagation()` for space key in `AirportInput.handleKeyDown`
