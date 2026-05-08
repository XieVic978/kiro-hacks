# ConnectFlight ✈️

> **Never waste a layover. Never miss a connection.**

ConnectFlight is an AI-powered flight decision tool that helps business travelers find the best flight *and* make the most of every layover by surfacing business contacts in their stopover cities.

---
### Demo Video: https://www.youtube.com/watch?v=BRiF7p6AOhM 

## What It Does

- **Smart flight search** — searches real flights via SerpAPI (Google Flights) and ranks them by Cheapest or Fastest priority
- **AI recommendations** — Groq LLM explains *why* the top pick is the best choice in plain English
- **Never Waste a Connection** — if your layover is ≥ 90 minutes and you have a contact in that city, the app surfaces them and suggests a meetup
- **Connections manager** — add, edit, search, and filter your business contacts by city/airport

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Flight data | SerpAPI (Google Flights engine) |
| AI | Groq API (llama-3.3-70b) |
| Routing | React Router v7 |
| State | React Context API |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install

```bash
cd kiro-hacks
npm install
npm install --prefix backend
```

### Configure environment

Create `backend/.env.local`:

```
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_key
PORT=5051
```

### Run (both frontend + backend)

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5051

---

## How Kiro Was Used

### Vibe Coding

The entire project was built through conversational prompts with Kiro in Autopilot mode. The workflow was:

1. **Design first** — shared a Figma screenshot and asked Kiro to implement the layout in React + Tailwind. Kiro generated the full page structure, card hierarchy, typography, and button styles in one pass.
2. **Feature by feature** — each feature was added in a focused conversation: airport autocomplete, SerpAPI integration, Groq AI explanation, "Never Waste a Connection" logic, multi-page routing, contacts manager.
3. **Iterative refinement** — bugs and edge cases were fixed conversationally ("the space key doesn't work in the city input", "Phoenix contact isn't matching the layover"). Kiro diagnosed root causes (`.trim()` stripping spaces, airport name not containing city name) and fixed them.

The most impressive generation was the **multi-layer airport matching logic** — Kiro built a three-tier matching system (direct substring → IATA code lookup → significant word extraction) to handle cases like "Ninoy Aquino International Airport (MNL)" matching a contact in "Manila".

### Spec-Driven Development

The spec in `.kiro/specs/flight-finder/` defined the full requirements, data models, API contract, scoring formula, and correctness properties before implementation began. This gave Kiro precise acceptance criteria to target — for example, the scoring formula weights (price 50%, duration 30%, stops 20%) and the normalization algorithm were specified in `design.md` and implemented exactly as written in `backend/src/scoring.ts`.

Compared to pure vibe coding, the spec approach meant fewer back-and-forth corrections on the backend — the API shape, error codes, and data types were agreed upfront.

### Steering

Steering docs kept Kiro aligned on key constraints throughout the project:
- **Never touch the backend unless explicitly asked** — prevented Kiro from refactoring working backend code when fixing frontend bugs
- **Use airline names, not index numbers** — after Kiro generated a Groq prompt that said "flight 0 vs flight 1", steering corrected this to always use the actual airline name
- **90-minute minimum for meetup suggestions** — kept the business logic consistent across all features

### Agent Hooks

Hooks were used to automate code quality checks during development — running ESLint automatically after file edits to catch issues before they accumulated.

---

## Project Structure

```
kiro-hacks/
├── frontend/
│   └── src/
│       ├── App.jsx              # Main flights page
│       ├── components/
│       │   ├── NavBar.jsx       # Navigation
│       │   └── AirportInput.jsx # Shared airport autocomplete
│       ├── pages/
│       │   └── ConnectionsPage.jsx
│       ├── store/
│       │   ├── ContactsContext.jsx
│       │   └── SearchContext.jsx
│       └── data/
│           └── airports.json    # airport data
├── backend/
│   └── src/
│       ├── index.ts             # Express server
│       └── scoring.ts           # Flight ranking logic
└── .kiro/
    ├── specs/
    ├── hooks/
    └── steering/
```

---

## License

MIT
