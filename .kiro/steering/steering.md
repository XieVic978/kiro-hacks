---
inclusion: always
---

# ConnectFlight — Steering Rules

## Project Identity
- App name: **ConnectFlight**
- Tagline: "Never waste a layover. Never miss a connection."

## What AI (Kiro) Was Used For
- Scaffolding the Express/TypeScript backend (`index.ts`, `scoring.ts`)
- Building the React frontend components: airport autocomplete, flight result cards, priority selector, "Why this flight" AI explainer
- Expanding the airports dataset from US-only to worldwide (130+ airports across all continents)
- Adding the "View on Google Flights" button with `booking_token` deep-linking
- Fixing bugs: malformed JSON entries, unused variables, wrong field names (`id` vs `code`)
- Wiring up the Groq API integration for plain-English flight recommendations
- Building the Connections Manager page with add/edit/delete/filter/search

## What AI Was NOT Used For
- Deciding which flight is "best" — that is always driven by the user's selected priority (Cheapest or Fastest)
- Choosing scoring weights — the deterministic formula was defined by the developer
- Making booking decisions — the app redirects to Google Flights; it never books anything

## Architecture Constraints
- **Do NOT touch the backend** unless the user explicitly asks. Frontend bugs are fixed in the frontend only.
- The backend runs on port **5051**. The frontend proxies to `http://localhost:5051`.
- Flight data comes from **SerpAPI** (real data). Do not replace with mock data.
- AI explanations use **Groq** (`llama-3.3-70b`). Do not switch models.

## Feature Rules
- The "Never Waste a Connection" feature requires a layover of **≥ 90 minutes** to suggest a meetup.
- Airport matching uses three tiers: (1) direct city substring, (2) IATA code → city lookup, (3) significant word extraction from airport name.
- Contacts store only the **city name** (not "City (CODE)") — strip the IATA suffix when saving from AirportInput.
- Priority options are **Cheapest** and **Fastest** only. No comfort priority.

## Code Style
- React functional components only, no class components.
- Tailwind CSS for all styling. No inline styles, no CSS modules.
- Shared components go in `frontend/src/components/`.
- Use `AirportInput` from `components/AirportInput.jsx` for any city/airport field — do not duplicate it.

## AI Prompts
- Groq prompts must use **airline names**, never index numbers like "flight 0" or "flight 1".
- The "Why this flight?" explanation should be 2-3 sentences, plain English.
- AI (Groq) is only used to *explain* the top pick in plain English, never to rank or score flights.
- The scoring logic in `scoring.ts` is a pure deterministic function — no LLM involvement.

## Priorities Given to AI
1. Keep code minimal — no unnecessary abstractions or extra features
2. Match existing project style and conventions before introducing new patterns
3. Fix bugs directly without refactoring surrounding code
4. Never expose secrets or hardcode API keys

## How Outputs Were Controlled
- Every change was reviewed before acceptance in supervised mode
- Kiro was given specific, scoped instructions per task (e.g. "remove the max budget option", "add a Google Flights button")
- When Kiro introduced unused variables or dead code, the developer caught and flagged them for removal
- The developer manually tested airport autocomplete and flight search after each change

## What Kiro Should NOT Do
- Do not add features not requested (no extra filters, no extra pages).
- Do not redesign existing UI — match the existing card/button style.
- Do not add tests unless explicitly asked.
- Do not commit or push code.
