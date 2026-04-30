# Requirements Document

## Introduction

Flight Finder is a single-page web application that helps users discover and compare flights based on personal preferences. Users enter a route and travel dates, apply filters (max price, max duration, no red-eye toggle), and receive a ranked list of flights. Each flight is scored by a deterministic formula and annotated with a plain-English AI-generated summary powered by the Groq API. Flight data is fetched from Google Flights via SerpAPI through a Python backend.

## Glossary

- **Flight_Finder**: The full-stack application (React frontend + Python backend).
- **Search_Form**: The UI component where users enter origin, destination, departure date, and optional return date.
- **Filter_Panel**: The UI component where users set max price, max duration, and the no-red-eye toggle.
- **Flight_Result**: A single flight option returned by SerpAPI, including airline, price, departure/arrival times, duration, and number of stops.
- **Scorer**: The backend module that applies the scoring formula to rank Flight_Results.
- **Score**: A numeric value computed by the Scorer representing the overall desirability of a Flight_Result (higher is better).
- **Summarizer**: The backend module that calls the Groq API to generate a plain-English description of a Flight_Result.
- **SerpAPI**: Third-party API used to retrieve Google Flights data.
- **Groq_API**: Third-party LLM API used to generate plain-English flight summaries.
- **Red-Eye Flight**: A flight whose departure time is between 22:00 and 05:59 local time.
- **No-Red-Eye Toggle**: A boolean filter that, when enabled, excludes Red-Eye Flights from results.

---

## Requirements

### Requirement 1: Flight Search

**User Story:** As a traveler, I want to search for flights by entering an origin, destination, and travel dates, so that I can see available options for my trip.

#### Acceptance Criteria

1. THE Search_Form SHALL accept an origin airport/city, a destination airport/city, a departure date, and an optional return date.
2. WHEN the user submits the Search_Form with valid inputs, THE Flight_Finder SHALL send a search request to the backend and display a loading indicator until results are returned.
3. IF the user submits the Search_Form with a missing origin, destination, or departure date, THEN THE Search_Form SHALL display an inline validation error identifying the missing field and SHALL NOT submit the request.
4. WHEN the backend returns Flight_Results, THE Flight_Finder SHALL display the results sorted by Score in descending order.
5. IF the SerpAPI request fails or returns no results, THEN THE Flight_Finder SHALL display a user-facing error message describing the issue.

---

### Requirement 2: Flight Filtering

**User Story:** As a traveler, I want to filter flights by price, duration, and departure time, so that I only see options that fit my constraints.

#### Acceptance Criteria

1. THE Filter_Panel SHALL provide a max-price input (numeric, in USD), a max-duration input (numeric, in hours), and a No-Red-Eye Toggle.
2. WHEN the user changes any filter value, THE Flight_Finder SHALL re-apply all active filters to the current Flight_Results without issuing a new SerpAPI request.
3. WHILE the No-Red-Eye Toggle is enabled, THE Flight_Finder SHALL exclude any Flight_Result whose departure time falls between 22:00 and 05:59.
4. WHEN a max-price value is set, THE Flight_Finder SHALL exclude any Flight_Result whose price exceeds the max-price value.
5. WHEN a max-duration value is set, THE Flight_Finder SHALL exclude any Flight_Result whose total duration exceeds the max-duration value in hours.
6. IF all Flight_Results are excluded by the active filters, THEN THE Flight_Finder SHALL display a message indicating no flights match the current filters.

---

### Requirement 3: Flight Scoring

**User Story:** As a traveler, I want flights ranked by an overall quality score, so that the best option for my preferences appears first.

#### Acceptance Criteria

1. THE Scorer SHALL compute a Score for each Flight_Result using a weighted formula that incorporates price, duration, and number of stops.
2. THE Scorer SHALL assign a higher Score to a Flight_Result with a lower price, all other factors being equal.
3. THE Scorer SHALL assign a higher Score to a Flight_Result with a shorter duration, all other factors being equal.
4. THE Scorer SHALL assign a higher Score to a Flight_Result with fewer stops, all other factors being equal.
5. THE Scorer SHALL normalize each factor (price, duration, stops) relative to the full set of Flight_Results before computing the weighted sum, so that scores are comparable across searches.
6. THE Scorer SHALL NOT use any AI or LLM model to compute the Score.

---

### Requirement 4: AI Flight Summaries

**User Story:** As a traveler, I want a plain-English summary for each flight, so that I can quickly understand the trade-offs without reading raw data.

#### Acceptance Criteria

1. WHEN Flight_Results are returned from SerpAPI, THE Summarizer SHALL generate a plain-English summary for each Flight_Result by calling the Groq_API.
2. THE Summarizer SHALL include in each summary the flight's key trade-offs, such as price relative to other results, arrival time, duration, and number of stops.
3. THE Summarizer SHALL produce summaries that are one to three sentences in length.
4. IF the Groq_API call fails for a Flight_Result, THEN THE Summarizer SHALL return a fallback summary containing the flight's price, duration, and number of stops in plain text without calling the Groq_API again.
5. THE Summarizer SHALL NOT use the Groq_API to rank or score flights; its sole responsibility is generating human-readable descriptions.

---

### Requirement 5: Backend API

**User Story:** As a developer, I want a clean backend API, so that the frontend can fetch flight data and summaries through a single interface.

#### Acceptance Criteria

1. THE Flight_Finder backend SHALL expose a POST `/api/flights` endpoint that accepts origin, destination, departure date, and optional return date as JSON body parameters.
2. WHEN a valid request is received, THE Flight_Finder backend SHALL query SerpAPI, score the results with the Scorer, generate summaries with the Summarizer, and return a JSON array of Flight_Results each containing: airline, price, departure time, arrival time, duration, stops, score, and summary.
3. IF a required parameter is missing from the request body, THEN THE Flight_Finder backend SHALL return a 400 status code with a JSON error message identifying the missing field.
4. IF the SerpAPI key or Groq_API key is not configured in the environment, THEN THE Flight_Finder backend SHALL return a 500 status code with a descriptive error message on startup or at request time.
5. THE Flight_Finder backend SHALL include CORS headers permitting requests from the frontend origin.
6. THE Flight_Finder backend SHALL return all monetary values in USD and all duration values in minutes as integers.

---

### Requirement 6: Frontend Flight Display

**User Story:** As a traveler, I want to see flight results in a clear, readable layout, so that I can compare options at a glance.

#### Acceptance Criteria

1. THE Flight_Finder SHALL display each Flight_Result as a card showing airline, price, departure time, arrival time, duration, number of stops, score, and AI summary.
2. THE Flight_Finder SHALL visually distinguish the highest-scored Flight_Result (e.g., a "Best Pick" badge).
3. WHEN results are loading, THE Flight_Finder SHALL display a loading skeleton or spinner in place of the result cards.
4. THE Flight_Finder SHALL be usable on viewport widths from 375px to 1440px without horizontal scrolling.
5. THE Flight_Finder SHALL meet WCAG 2.1 AA color contrast requirements for all text and interactive elements.
