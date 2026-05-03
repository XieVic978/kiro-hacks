# ConnectFlight — Project Spec

## What We Built

**ConnectFlight** is a full-stack flight search and decision assistant for business travelers. Users enter an origin, destination, and departure date, then get ranked flight results with an AI-powered explanation of the top pick. The app also surfaces layover networking opportunities ("Never Waste a Connection") and lets users jump directly to the exact flight on Google Flights.

## Problems We Solve

1. **Which flight should I take?** — AI ranks flights by your priority (cheapest or fastest) and explains the recommendation in plain English.
2. **How do I make the most of my layover?** — If you have a business contact in your stopover city and the layover is ≥ 90 minutes, the app surfaces that contact and suggests a meetup.

## Features

- Airport autocomplete with 130+ worldwide airports across all continents
- Live flight search via SerpAPI (Google Flights data)
- Priority-based sorting: Cheapest or Fastest
- "Best Match" card with visual distinction (⭐ badge)
- AI explanation of the top pick via Groq (llama-3.3-70b) — "Why this flight?"
- **Never Waste a Connection** — matches layover cities against a contacts list using three-tier matching
- "View on Google Flights" button using `booking_token` deep-link for each result
- Connections Manager page: add, edit, delete, filter, and search business contacts
- Clear/reset search state
- Search persists when switching between Flights and Connections pages

## Tech Stack

| Layer | Technology | Why |
|-----------|-----------------------------------|----------------------------------------------|
| Frontend | React 19 + Vite + Tailwind CSS v4 | Fast dev experience, utility-first styling |
| Backend | Node.js + Express + TypeScript | Lightweight API server, strong typing |
| Flight data | SerpAPI (Google Flights engine) | Real-time flight results without scraping |
| AI | Groq API (llama-3.3-70b) | Fast inference for plain-English recommendations |
| Routing | React Router v7 | Multi-page SPA navigation |
| State | React Context | Simple shared state without Redux overhead |

## Project Structure

```
frontend/src/
  App.jsx                    — main flights page, search form, results
  components/
    NavBar.jsx               — top navigation (Flights / Connections tabs)
    AirportInput.jsx         — shared airport autocomplete component
  pages/
    ConnectionsPage.jsx      — contacts manager page
  store/
    SearchContext.jsx        — search state (from, to, date, priority, results)
    ContactsContext.jsx      — contacts for layover matching
  data/
    airports.json            — worldwide airport list (frontend autocomplete)

backend/src/
  index.ts                   — Express server, /api/flights, /api/recommend
  scoring.ts                 — Groq API integration for flight recommendations
  airports.json              — worldwide airport list (backend search endpoint)
```

## Non-Goals (explicitly excluded)
- No user authentication
- No database persistence (contacts reset on page refresh)
- No disability/accessibility flight filtering (SerpAPI doesn't provide this data)
- No comfort priority (only Cheapest and Fastest)
- No max budget filter
