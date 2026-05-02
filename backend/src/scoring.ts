import fetch from 'node-fetch'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL   = 'llama-3.3-70b-versatile'

export interface FlightSummary {
  airline:       string
  departure_time: string | null
  arrival_time:   string | null
  duration:       string | null
  number_of_stops: number
  price:          number | null
  result_type:    string
  flight_numbers: string[]
}

export interface GroqRecommendation {
  recommendation: string
  reasoning:      string
  top_pick_index: number | null
}

export async function recommendFlights(
  flights: FlightSummary[],
  userPrompt: string,
  groqApiKey: string
): Promise<GroqRecommendation> {
  const flightList = flights
    .map((f, i) =>
      `[${i}] ${f.airline} | ${f.departure_time} → ${f.arrival_time} | ` +
      `${f.duration} | ${f.number_of_stops === 0 ? 'Non-stop' : `${f.number_of_stops} stop(s)`} | ` +
      `$${f.price ?? 'N/A'} | ${f.result_type}`
    )
    .join('\n')

  const systemPrompt = `You are a helpful flight recommendation assistant.
Given a list of flights and a user's preference or question, recommend the best option.
Respond ONLY with valid JSON in this exact shape:
{
  "recommendation": "<one sentence recommendation>",
  "reasoning": "<2-3 sentence explanation>",
  "top_pick_index": <number — the index of the best flight, or null if unclear>
}`

  const userMessage = `User preference: ${userPrompt}\n\nAvailable flights:\n${flightList}`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model:    GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      temperature: 0.4,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error ${response.status}: ${err}`)
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[]
  }

  const content = data.choices?.[0]?.message?.content ?? ''

  try {
    return JSON.parse(content) as GroqRecommendation
  } catch {
    // If Groq wraps the JSON in markdown fences, strip them
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) return JSON.parse(match[1]) as GroqRecommendation
    throw new Error(`Could not parse Groq response: ${content}`)
  }
}
