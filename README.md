# Cricket Live

A live cricket scoring and broadcast overlay system. One laptop runs the server, while other laptops can connect through their browsers.

| Page | URL | Who will use it |
|---|---|---|
| Scorer / Admin | `/admin` → `/admin/matches/:id` | Scorer (PIN required). **Must not appear on the live stream.** |
| Public Scoreboard | `/scoreboard/:id` (`?view=full` = complete scorecard) | Live stream. Use `?bg=transparent` for OBS. |
| Charts Studio | `/charts/:id` | Commentator (PIN required). Clicking a chart on the left displays it on the live stream. |
| Chart Overlay (Output) | `/overlay/:id` | OBS Browser Source. Transparent background; automatically follows the commentator's selected chart. |

Any changes made in the Admin panel (adding, editing, deleting a ball, or undoing an action) are instantly synchronized across all pages through WebSockets.

## Technology Stack

- **Frontend:** React 18 + Vite + React Router + Recharts
- **Backend:** Python, FastAPI, SQLAlchemy, **pandas + numpy** (for chart data)
- **Database:** PostgreSQL (localhost). SQLite is also supported for quick testing.
- **Live Updates:** WebSocket (`/ws/matches/:id`)

## Project Folder Structure

```text
cricket-live/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, startup
│   │   ├── core/                    # Configuration (.env), PIN security
│   │   ├── db/session.py            # Database engine and session
│   │   ├── models/                  # Match, Player, Innings, Delivery
│   │   ├── schemas/                 # Request and response schemas
│   │   ├── services/
│   │   │   ├── scoring_engine.py    # All cricket rules (pure Python, tested)
│   │   │   ├── match_service.py     # Database integration and live state
│   │   │   ├── analytics_service.py # pandas/numpy chart data
│   │   │   ├── overlay_service.py   # Manages the active broadcast chart
│   │   │   └── realtime.py          # WebSocket rooms
│   │   └── api/routes/              # Auth, matches, scoring, analytics, overlay, WS
│   └── tests/                       # Engine, API, and WebSocket tests
├── frontend/src/
│   ├── routes/
│   ├── layouts/
│   ├── pages/
│   ├── components/
│   │   ├── admin/
│   │   ├── scoreboard/
│   │   ├── charts/
│   │   └── common/
│   ├── api/
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── config/
├── scripts/
│   ├── seed_demo.py
│   └── lan_ip.py
└── docker-compose.yml
```

## Local Setup (Windows / Linux / macOS)

### 1. PostgreSQL Setup (One-Time)

```sql
-- Connect using: psql -U postgres

CREATE USER cricket WITH PASSWORD 'cricket';
CREATE DATABASE cricket OWNER cricket;
```

If you don't want to use PostgreSQL yet, add the following to `backend/.env`:

```env
DATABASE_URL=sqlite:///./cricket.db
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env

# Change the PIN in the .env file.

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Database tables are automatically created when the application starts for the first time.

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend URL: `http://localhost:5173`

The development server is also accessible over the local network.

### 4. Demo Data (Optional)

```bash
python scripts/seed_demo.py
```

This generates a complete simulated cricket match, allowing you to see the charts immediately.

## Connecting 3–4 Laptops on the Same LAN

Yes, multiple laptops can connect simultaneously.

On the laptop running the server, execute:

```bash
python scripts/lan_ip.py
```

The script prints the required URLs, for example:

```text
http://192.168.1.10:5173/admin
```

Other laptops must be connected to the same Wi-Fi network or router. They can then open the provided URL in their browsers.

The frontend automatically detects the backend using the hostname from which the page was opened:

```text
http://<current-host>:8000
```

No additional configuration is required.

**Windows Firewall:** When prompted for network access for the first time, allow access on Private Networks. Alternatively, manually open ports `5173` and `8000`.

### Recommended Setup

- **Laptop 1:** Server (PostgreSQL + Backend + Frontend) and OBS Studio (scoreboard and overlay browser sources).
- **Laptop 2:** Scorer using `/admin`.
- **Laptop 3:** Commentator using `/charts/:id`.

### OBS Studio Configuration

Add the following URLs as Browser Sources:

**Scoreboard:**
```text
http://<ip>:5173/scoreboard/1?bg=transparent
```

Resolution: `1920 × 1080`

**Chart Overlay:**
```text
http://<ip>:5173/overlay/1
```

Resolution: `1920 × 1080`

## Docker Deployment

For a deployment-style setup:

```bash
cp .env.example .env

# Update the PIN and database password.

docker compose up --build
```

Application URL:

```text
http://<laptop-ip>/
```

The application runs on port `80`.

Nginx serves the frontend and proxies `/api` and `/ws` requests to the backend.

## Running Tests

```bash
cd backend

pytest -q
```

## Cricket Rules Handled by the Scoring Engine

The scoring engine handles the following cricket rules and calculations:

1. **Legal Deliveries:** Correctly distinguishes legal balls from wides and no-balls. An over consists of six legal deliveries.
2. **Ball Counting:** A wide does not count as a batter's ball faced, whereas a no-ball does.
3. **Extras:** Byes and leg-byes are not credited to the bowler. Wides and no-balls are credited to the bowler.
4. **Strike Rotation:** Handles odd-run rotation, strike changes at the end of an over, and the arrival of a new batter after a dismissal.
5. **Free Hits:** After a no-ball, only permitted dismissal types, such as run-out and obstructing the field, are allowed.
6. **Wicket Types and Validation:** Supports bowled, caught, LBW, stumped, hit wicket, and other applicable dismissal types, with validation based on the delivery type.
   - Bowled, caught, LBW, stumped, and hit wicket apply to the striker.
   - On a wide, only permitted dismissals such as stumped, run-out, and hit wicket are allowed.
   - On a no-ball, only run-out is allowed.
7. **Bowler Statistics:** Calculates bowler wickets, runs conceded, maidens, and economy rate. Run-outs are not credited to the bowler.
8. **Batting Statistics:** Calculates strike rate, boundaries, and balls faced.
9. **Fall of Wickets:** Tracks wickets and partnerships.
10. **Bowler Restrictions:** Prevents the same bowler from bowling consecutive overs.
11. **Innings Completion:** Handles all-out situations, completion of allocated overs, successful target chases, and early innings termination (declaration).
12. **Match Results:** Determines wins by runs, wins by wickets, and tied matches.
13. **Ball Editing:** Editing or deleting any delivery automatically recalculates the complete scorecard and related statistics.

## Current Limitations

The following limitations are currently acknowledged:

- **Overlay Persistence:** The active chart selection is stored in server memory. It resets when the server restarts, although match data remains safe.
- **Boundary Counting:** Fours and sixes are counted only when exactly 4 or 6 runs are scored from the bat. Overthrow boundaries resulting in 5 or 7 runs are not counted as fours or sixes.
- **Super Overs and DLS:** Not currently supported.
- **Database Migrations:** Alembic has not yet been integrated. Database tables are currently created using SQLAlchemy's `create_all()` method.
