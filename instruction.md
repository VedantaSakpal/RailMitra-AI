# Mumbai Local AI — Development Instructions

## 1. Project Goal
Build a modern **AI-powered Mumbai Local Railway Web App** covering:
- Central Line
- Western Line
- Harbour Line

The app helps passengers search trains, plan journeys, track trains, book tickets/passes, receive AI assistance, and get real-time alerts.

## 2. Technology Stack

### Frontend
- React.js + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Zustand
- Lucide React
- Recharts
- Leaflet + OpenStreetMap

### Backend
- Node.js
- Express.js
- TypeScript
- REST API
- Socket.IO
- JWT Authentication
- bcrypt
- Zod validation

### Database
- PostgreSQL(supabase)
- Prisma ORM

### Real-Time
- Socket.IO
- Redis

### AI Service
- Python
- FastAPI
- Pandas
- NumPy
- Scikit-learn
- XGBoost for future prediction models

## 3. Project Structure

```text
mumbai-local-ai/
├── client/
├── server/
├── ai-service/
├── prisma/
├── docs/
├── .env.example
├── docker-compose.yml
└── README.md
```

Keep frontend, backend, database, and AI services separate.

## 4. Railway System

Support:
- Central Line
- Western Line
- Harbour Line

Database entities:
- User
- RailwayLine
- Station
- Train
- TrainRoute
- TrainSchedule
- StationStop
- Ticket
- Pass
- Journey
- Payment
- Notification
- PassengerReport

Never hardcode railway data inside React components.

## 5. Development Rule

**Build feature-by-feature.**

Do not implement the entire application at once.

For every phase:
1. Build
2. Connect
3. Test
4. Fix errors
5. Confirm working
6. Move to next phase

The app must remain runnable after every phase.

---

# PHASE 1 — Project Setup

Create:
- React frontend
- Express backend
- PostgreSQL database
- Prisma
- Environment configuration
- Basic API structure
- Error handling
- CORS

Create:

`GET /api/health`

Verify frontend, backend, and database work before continuing.

---

# PHASE 2 — UI Foundation

Create responsive pages:
- Landing
- Login
- Register
- Dashboard
- Train Search
- Train Details
- Live Tracking
- Tickets
- Passes
- AI Assistant
- Profile

Design:
- Modern
- Premium
- Clean
- Mobile-first
- Accessible
- Light/Dark mode
- Smooth but minimal animations

---

# PHASE 3 — Authentication

Implement:
- Register
- Login
- Logout
- JWT
- Password hashing
- Protected routes
- User profile
- Role-based access

Roles:
- USER
- ADMIN
- OPERATOR

Test authentication completely before continuing.

---

# PHASE 4 — Railway Data

Create database and seed data for:
- Central Line
- Western Line
- Harbour Line

Include:
- Stations
- Trains
- Routes
- Timetables
- Station stops

Create APIs for railway data.

---

# PHASE 5 — Train Search

User can select:
- Source
- Destination
- Date
- Time
- Line

Show:
- Train
- Line
- Departure
- Arrival
- Duration
- Stops
- Fast/Slow
- Status

Provide:
- Fastest route
- Earliest train
- Fewest stops
- Alternative routes

---

# PHASE 6 — AI Journey Planner

User can ask:

`"How do I travel from Panvel to Dadar at 8 AM?"`

AI should provide:
- Recommended train
- Route
- Departure
- Arrival
- Interchange
- Duration
- Crowd level
- Alternative route

Support:
- English
- Hindi
- Marathi
- Hinglish

AI must use real backend railway data and must not hallucinate train information.

---

# PHASE 7 — Live Train Tracking

Implement:
- Passenger opt-in location sharing
- GPS
- Socket.IO
- Redis
- Map interface

Show:
- Train location
- Direction
- Next station
- ETA
- Delay
- Active passenger signals
- Tracking confidence

Never expose individual passenger locations.

Only show aggregated train-level information.

---

# PHASE 8 — Crowd Prediction

Create crowd levels:

🟢 Low  
🟡 Moderate  
🟠 High  
🔴 Very High

Use:
- Anonymous passenger signals
- Historical patterns
- Time/day
- Passenger reports

AI should predict future crowd levels.

---

# PHASE 9 — Delay Prediction

Create AI prediction using:
- Historical delays
- Current delay
- Train
- Station
- Time
- Day
- Other available data

Show:

`Expected delay: 7–10 minutes`

Always clearly mark AI predictions as estimates.

---

# PHASE 10 — Ticket System

Implement:
- Single journey ticket
- Source
- Destination
- Passenger count
- Fare calculation
- QR ticket

Ticket status:
- ACTIVE
- USED
- EXPIRED
- CANCELLED

Generate a unique QR code.

---

# PHASE 11 — Pass System

Support:
- Daily Pass
- Monthly Pass
- Quarterly Pass
- Yearly Pass

Include:
- Passenger
- Route/zone
- Validity
- QR code
- Status
- Renewal
- Expiry reminder
- Pass history

---

# PHASE 12 — Platform Ticket

Allow users to select:
- Station
- Passenger count
- Date

Generate digital QR platform ticket.

---

# PHASE 13 — AI Assistant

Create an AI chat assistant for:
- Train status
- Route planning
- Crowd information
- Delay information
- Platforms
- Fare
- Pass recommendation
- Travel questions

The assistant should use backend APIs/tools for live information.

Never fabricate railway status, fare, platform, or timetable information.

---

# PHASE 14 — Smart Notifications

Implement:
- Train approaching
- Delay alerts
- Platform changes
- Cancellation
- Destination approaching
- Journey reminders
- Pass expiry

---

# PHASE 15 — Safety

Implement:
- SOS
- Emergency contact
- Live journey sharing
- Journey status

All location sharing must be explicit and opt-in.

---

# PHASE 16 — Passenger Reports

Allow users to report:
- Delays
- Crowding
- Platform issues
- Lift/escalator issues
- Cleanliness
- Safety issues

AI can automatically categorize reports.

---

# PHASE 17 — User Dashboard

Show:
- Total journeys
- Money spent
- Pass savings
- Favorite routes
- Favorite stations
- Average travel time
- Average delay

Use Recharts for statistics.

---

# PHASE 18 — Admin Dashboard

Admin can manage:
- Users
- Stations
- Lines
- Trains
- Timetables
- Tickets
- Passes
- Reports
- Delays
- Notifications

Show:
- Active users
- Active trains
- Current delays
- Crowd alerts
- Tickets sold
- Passes sold
- Reports

---

# PHASE 19 — Advanced AI

Add:
- AI route recommendation
- Crowd prediction
- Delay prediction
- Fare/pass optimization
- Personalized travel suggestions
- Alternative route recommendation

Example:

`"You normally travel at 8:15 AM. Today's train is delayed. Take this alternative."`

---

# PHASE 20 — Security

Implement:
- Password hashing
- JWT security
- Input validation
- Rate limiting
- CORS
- Role authorization
- Secure environment variables
- Location privacy

Never expose API keys in frontend.

Never commit `.env`.

Provide `.env.example`.

---

# PHASE 21 — Testing

Test every feature for:
- Success
- Failure
- Loading
- Empty state
- Invalid input
- Authentication
- Authorization
- Mobile responsiveness

Fix all major errors before moving forward.

---

# API Structure

```text
/api/auth
/api/users
/api/stations
/api/lines
/api/trains
/api/routes
/api/tickets
/api/passes
/api/payments
/api/journeys
/api/tracking
/api/crowd
/api/notifications
/api/reports
/api/ai
/api/admin
```

Use consistent API responses:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

# Final Requirements

The final application should provide:

Search → AI Route → Train Details → Live Tracking → Crowd/Delay Prediction → Ticket/Pass → Journey Alerts → AI Assistance → Journey Complete → Travel Statistics.

Keep the code modular, reusable, scalable, secure, and well documented.

**Most important rule: complete and test each phase before starting the next phase.**