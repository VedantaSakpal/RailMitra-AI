# RailMitra AI Assistant — Build Specification

## 1. Scope

Build **ONLY the AI Assistant feature** for RailMitra.

The AI Assistant should work as a Mumbai Local Railway travel assistant that understands natural-language questions, retrieves verified railway data through tools/services, and gives clear answers.

### Do NOT modify
- Ticket booking/payment flow
- Mock payment system
- Authentication flow
- Marketplace or other RailMitra modules
- Existing UI/features unrelated to the AI Assistant

Only create the minimum integration needed to read existing RailMitra data.

---

## 2. Main Goal

The AI Assistant should help users with:

- Journey planning
- Source → destination route information
- Central / Western / Harbour line information
- Train search and timetable information
- Fare calculation
- Station information
- Interchange guidance
- Live train status (when a real API is available)
- Service alerts (when verified data is available)
- Crowd information (when real data is available)
- Weather information (when a weather API is connected)
- User's existing ticket information (read-only)
- Railway rules, FAQs and general information
- English, Hindi and Marathi conversations

The AI must **not invent railway facts**.

---

## 3. Core Architecture

```text
React/Vite Chat UI
        ↓
RailMitra Backend API
        ↓
AI Assistant Service
        ↓
Gemini / LLM
        ↓
Tool Selection
        ↓
Railway Database / APIs / RAG
        ↓
Verified Result
        ↓
Natural-language Response
```

The LLM is the reasoning and conversation layer.

The database/APIs are the source of truth for:
- Distance
- Fare
- Routes
- Stations
- Train information
- Ticket information
- Live status
- Alerts

---

## 4. AI Agent Flow

For every user message:

1. Understand the user's intent.
2. Extract required information such as:
   - source
   - destination
   - date
   - time
   - train
   - station
3. Decide whether a tool is required.
4. Call the appropriate tool.
5. Receive verified data.
6. Generate a simple answer.
7. If required information is missing, ask a concise follow-up question.
8. Never fabricate unavailable information.

Example:

User:
> How do I go from Dombivli to CSMT?

Agent:
1. Detect journey-planning intent.
2. Call route/search tool.
3. Retrieve Central Line route information.
4. Return route, approximate journey details, stops and available train information.

---

## 5. Tool Calling

Create a tool layer between the LLM and RailMitra services.

Suggested tools:

```text
search_route(source, destination)
calculate_distance(source, destination)
calculate_fare(source, destination, journey_type, travel_class, passenger_count)
search_trains(source, destination, date, time)
get_station_info(station)
get_live_train_status(train_id)
get_service_alerts(line, station)
get_crowd_status(station, train)
get_weather(location)
get_my_tickets(user_id)
get_ticket_status(ticket_id, user_id)
```

### Important

The AI must never calculate exact railway fares or distances from its own knowledge.

For example:

```text
User → "How much is Dombivli to CSMT?"

AI → calculate_fare(...)
Backend → exact fare
AI → explain result
```

---

## 6. Journey Planner

Support questions such as:

- Dombivli to CSMT
- Thane to Andheri
- Kurla to Panvel
- Kalyan to Kasara
- Borivali to Churchgate

The response can include:

- Source
- Destination
- Railway line
- Direct/connecting route
- Interchange station if required
- Approximate journey duration
- Number of stops
- Distance
- Train type where available
- Fare

Use RailMitra's existing railway station/route database wherever possible.

---

## 7. Fare Assistant

The AI Assistant should call the existing fare calculation service/database.

Supported queries:

```text
"What is the fare from Dombivli to CSMT?"
"How much for first class?"
"What is the return fare?"
"How much for 3 passengers?"
```

Do not duplicate fare logic inside the LLM.

Use the same backend fare source used by RailMitra.

---

## 8. Train Search

Support:

- Next train
- Train between two stations
- Fast/slow local
- Train number
- Departure time
- Arrival time
- Stops
- Line

Important distinction:

### Timetable data
Can be returned from stored timetable data.

### Live data
Must only be shown when a verified live railway API/data source is connected.

If live data is unavailable, clearly say that the information is timetable/static data.

---

## 9. Station Assistant

Example questions:

```text
"What facilities are available at Dombivli?"
"Which lines serve Kurla?"
"Where can I interchange?"
"Is there a ticket counter?"
```

Use structured station data where available.

Use RAG for unstructured station/railway documentation.

---

## 10. Live Status and Alerts

Support:

- Train delay
- Current train status
- Cancellations
- Service disruptions
- Mega blocks
- Station alerts

Only use verified real-time sources.

If no live source is connected:

```text
I don't have verified live-status data right now.
I can provide the scheduled timetable instead.
```

Never generate fake live status.

---

## 11. Weather

If a weather API is connected, support:

```text
"Will it rain in Mumbai?"
"Should I carry an umbrella for my journey?"
```

Weather data must come from the weather API.

Do not invent current weather.

---

## 12. User Ticket Queries

The AI may provide **read-only** information from the existing authenticated RailMitra account.

Examples:

```text
"Show my tickets"
"What is my latest ticket?"
"Is my ticket still valid?"
```

Use the authenticated user's identity from the backend/JWT.

Never ask the user to manually provide another user's ID.

Do not expose private ticket information to another user.

---

## 13. RAG

Use RAG for unstructured railway information such as:

- Railway FAQs
- Ticket/pass rules
- General railway terminology
- Station facilities documentation
- RailMitra help documentation
- Travel guidelines

### Do NOT use RAG as the source of truth for:

- Exact fare
- Exact distance
- Ticket status
- User data
- Booking data
- Live train status

Those should come from backend tools/APIs.

Suggested flow:

```text
User Question
      ↓
Intent Detection
      ↓
RAG Retrieval (if informational)
      ↓
Relevant Documents
      ↓
Gemini
      ↓
Answer
```

---

## 14. Gemini / LLM Integration

Use Gemini or another supported LLM as the AI reasoning layer.

The implementation must keep these configurable:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=
```

Do not hard-code API keys.

If the API key/model is missing, **stop and ask the developer for it** instead of creating fake credentials.

The model should support tool/function calling.

---

## 15. Multilingual Support

The assistant should understand and respond in:

- English
- Hindi
- Marathi

Examples:

```text
"मला डोंबिवली ते CSMT जायचे आहे."

"मुझे डोंबिवली से CSMT जाना है।"

"I want to travel from Dombivli to CSMT."
```

The response language should normally follow the user's language.

---

## 16. Conversation Context

Maintain short-term conversation context.

Example:

User:
> I want to go from Dombivli to CSMT.

AI:
> Sure.

User:
> What is the fare?

The assistant should understand that "fare" refers to the previously discussed journey.

Use Redis or the existing application session/context system if available.

Do not store unnecessary sensitive information.

---

## 17. Suggested Folder Structure

Adapt this to the existing RailMitra architecture instead of unnecessarily restructuring the project.

```text
ai-assistant/
│
├── agent/
│   ├── agent.ts
│   ├── prompts.ts
│   └── toolRegistry.ts
│
├── tools/
│   ├── routeTool.ts
│   ├── fareTool.ts
│   ├── trainTool.ts
│   ├── stationTool.ts
│   ├── statusTool.ts
│   ├── alertTool.ts
│   ├── crowdTool.ts
│   ├── weatherTool.ts
│   └── ticketTool.ts
│
├── services/
│   ├── railwayService.ts
│   ├── weatherService.ts
│   └── ticketService.ts
│
├── rag/
│   ├── retriever.ts
│   ├── embeddings.ts
│   └── documents.ts
│
├── memory/
│   └── conversationMemory.ts
│
├── schemas/
│   └── aiSchemas.ts
│
└── config/
    └── aiConfig.ts
```

If RailMitra already has an appropriate structure, integrate into it instead of creating duplicate services.

---

## 18. Chat UI Requirements

Create a clean RailMitra-style chat interface.

Required:

- Message list
- User/AI message bubbles
- Text input
- Send button
- Loading/typing state
- Error state
- Tool-result-friendly responses
- Suggested questions
- Mobile responsive design

Suggested quick prompts:

```text
Plan my journey
Find next train
Calculate fare
Station information
Check my ticket
Railway rules
```

---

## 19. Error Handling

Handle:

- Missing source
- Missing destination
- Invalid station
- API unavailable
- Gemini API failure
- Railway service unavailable
- RAG failure
- Authentication failure
- Timeout

Never show raw stack traces to users.

Return simple messages.

Example:

```text
I couldn't retrieve the train information right now.
Please try again in a moment.
```

---

## 20. Security

- Never expose API keys in frontend code.
- Keep Gemini/API keys in backend environment variables.
- Validate all tool inputs.
- Use authenticated user context for personal data.
- Do not allow arbitrary database queries from the LLM.
- Use allowlisted tools only.
- Sanitize user input.
- Apply rate limiting to AI endpoints.
- Do not expose internal errors.
- Do not let the LLM directly execute SQL.

---

## 21. Required External Resources

Before implementation, check whether the following are available.

### Required

1. Gemini API key
2. Gemini model name/version
3. Existing RailMitra backend API endpoints
4. Existing station/route database

### Optional

5. Railway timetable API
6. Live train-status API
7. Service-alert source/API
8. Crowd-data API
9. Weather API
10. Vector database / embedding provider

If any required external resource is missing, ask the developer for the exact value/API/documentation.

Do not invent:
- API keys
- API URLs
- database records
- train status
- live delays
- railway responses

---

## 22. Development Approach

### Phase 1 — Inspect Existing RailMitra

First inspect:

- frontend structure
- backend structure
- authentication
- station database
- route database
- fare service
- existing APIs
- environment variables

Do not modify unrelated features.

### Phase 2 — AI Core

Implement:

- Gemini integration
- system prompt
- conversation handling
- tool registry
- tool calling
- error handling

### Phase 3 — Railway Tools

Implement and connect:

- route
- distance
- fare
- train search
- station information
- ticket read-only queries

### Phase 4 — External Data

Add only when credentials/API documentation are provided:

- live status
- alerts
- crowd
- weather

### Phase 5 — RAG

Add railway FAQ/document retrieval.

### Phase 6 — Multilingual + Memory

Add:

- English
- Hindi
- Marathi
- short-term conversation context

### Phase 7 — UI Integration

Connect the AI Assistant to the existing RailMitra frontend.

### Phase 8 — Testing

Test:

- normal questions
- missing information
- invalid stations
- multilingual questions
- tool failures
- API failures
- authenticated ticket queries
- hallucination prevention
- security
- mobile UI

---

## 23. Acceptance Criteria

The feature is complete when:

- User can open the RailMitra AI Assistant.
- User can chat naturally.
- Gemini/LLM integration works.
- Tool calling works.
- Route information comes from verified RailMitra data.
- Fare comes from the existing fare source.
- Train information comes from timetable/live sources.
- Station information works.
- Read-only user ticket queries work with authentication.
- RAG answers railway FAQ/document questions.
- English/Hindi/Marathi are supported.
- Conversation context works.
- Missing external APIs are handled gracefully.
- The assistant does not fabricate railway facts.
- Existing RailMitra ticket/payment and unrelated features remain unchanged.

---

## 24. Important Rule for the AI Coding Agent

Build **only the RailMitra AI Assistant feature**.

Before changing anything:

1. Inspect the existing project.
2. Reuse existing services/APIs/database models.
3. Avoid duplicate railway/fare logic.
4. Avoid changing unrelated modules.
5. Ask for missing API keys, credentials, endpoints, or documentation.
6. Never invent external API details.
7. Keep all AI integrations behind backend APIs.
8. Keep the LLM separate from the source of truth.
9. Prefer deterministic backend tools for railway facts.
10. Provide a clear implementation summary and list of required developer inputs after each phase.
