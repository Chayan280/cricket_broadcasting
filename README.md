# Cricket Live

Live cricket scoring + broadcast overlays. Ek laptop pe server chalta hai, baaki laptops browser se connect hote hain.

| Page | URL | Kaun use karega |
|---|---|---|
| Scorer / admin | `/admin` → `/admin/matches/:id` | Scorer (PIN chahiye). **Stream mein nahi dikhana** |
| Public scoreboard | `/scoreboard/:id` (`?view=full` = poora scorecard) | Live stream. OBS ke liye `?bg=transparent` |
| Charts studio | `/charts/:id` | Commentator (PIN). Left side se chart click = stream pe aa jata hai |
| Chart overlay (output) | `/overlay/:id` | OBS browser source. Transparent, commentator ke choice ko follow karta hai |

Admin mein jo bhi change hota hai (ball add / edit / delete / undo) wo WebSocket se sab pages pe turant update ho jata hai.

## Stack
- **Frontend**: React 18 + Vite + React Router + Recharts
- **Backend**: Python, FastAPI, SQLAlchemy, **pandas + numpy** (chart data)
- **DB**: PostgreSQL (localhost). Quick trial ke liye SQLite bhi chalega
- **Live updates**: WebSocket (`/ws/matches/:id`)

## Folder structure
```
cricket-live/
├─ backend/
│  ├─ app/
│  │  ├─ main.py                  # FastAPI app, CORS, startup
│  │  ├─ core/                    # config (.env), PIN security
│  │  ├─ db/session.py            # engine + session
│  │  ├─ models/                  # Match, Player, Innings, Delivery
│  │  ├─ schemas/                 # request bodies
│  │  ├─ services/
│  │  │  ├─ scoring_engine.py     # ALL cricket rules (pure python, tested)
│  │  │  ├─ match_service.py      # DB <-> engine, builds live state
│  │  │  ├─ analytics_service.py  # pandas/numpy chart data
│  │  │  ├─ overlay_service.py    # which chart is on air
│  │  │  └─ realtime.py           # websocket rooms
│  │  └─ api/routes/              # auth, matches, scoring, analytics, overlay, ws
│  └─ tests/                      # engine + API + websocket tests
├─ frontend/src/
│  ├─ routes/  layouts/  pages/  components/{admin,scoreboard,charts,common}/
│  ├─ api/  hooks/  utils/  styles/  config/
├─ scripts/  seed_demo.py, lan_ip.py
└─ docker-compose.yml
```

## Local run (Windows / Linux / Mac)

### 1) PostgreSQL (ek baar)
```sql
-- psql -U postgres
CREATE USER cricket WITH PASSWORD 'cricket';
CREATE DATABASE cricket OWNER cricket;
```
(Postgres nahi chahiye abhi? `backend/.env` mein `DATABASE_URL=sqlite:///./cricket.db` daal do.)

### 2) Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env         # Linux/Mac: cp .env.example .env   (PIN yahan badlo)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Tables pehli baar start pe khud ban jate hain.

### 3) Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173 , LAN pe bhi khula hai
```

### 4) Demo data (optional)
```bash
python scripts/seed_demo.py    # ek poora random match khel deta hai, charts turant dikh jate hain
```

## 3-4 laptops ek saath (LAN)
Haan, possible hai. Server laptop pe `python scripts/lan_ip.py` chalao, wo URLs print kar dega (e.g. `http://192.168.1.10:5173/admin`).
Baaki laptops same Wi-Fi/router pe hon aur wo URL browser mein kholen. Frontend khud `http://<jis-host-se-page-khula>:8000` pe API dhoondhta hai, kuch config nahi chahiye.

Windows pe pehli baar firewall popup aaye to **Private network allow** karo, ya ports 5173 aur 8000 manually open karo.

Typical setup:
- Laptop 1: server (Postgres + backend + frontend) + OBS (scoreboard + overlay browser sources)
- Laptop 2: scorer (`/admin`)
- Laptop 3: commentator (`/charts/:id`)

OBS mein Browser Source: `http://<ip>:5173/scoreboard/1?bg=transparent` (1920x1080) aur `http://<ip>:5173/overlay/1` (1920x1080).

## Docker (deployment style)
```bash
cp .env.example .env           # PIN aur DB password badlo
docker compose up --build      # http://<laptop-ip>/  (port 80)
```
nginx frontend serve karta hai aur `/api` + `/ws` backend ko proxy karta hai.

## Tests
```bash
cd backend && pytest -q
```

## Cricket rules jo engine handle karta hai
- Legal ball vs wide / no-ball (over 6 *legal* balls ka), wide pe batter ki ball nahi gini jati, no-ball pe gini jati hai
- Bye / leg bye bowler ke naam nahi; wide / no-ball bowler ke naam
- Strike rotation: odd runs, over end, wicket ke baad naya batter dismissed wale ke end pe
- **Free hit** (no-ball ke baad): sirf run out / obstructing allowed
- Wicket types + validation (bowled/caught/lbw/stumped/hit wicket sirf striker; wide pe sirf stumped/run out/hit wicket; no-ball pe sirf run out)
- Bowler credit (run out bowler ko nahi milta), maidens, economy, strike rate, fall of wickets, partnerships
- Same bowler do overs lagatar nahi
- Innings end: all out / overs complete / target chase / early end (declare)
- Result: runs se jeet, wickets se jeet, tie
- Kisi bhi ball ko edit / delete karo, poora scorecard dobara calculate hota hai

## Limitations (honest list)
- Chart overlay ki "on air" state server memory mein hai: server restart pe reset (match data safe rehta hai)
- 4 aur 6 tab count hote hain jab bat se exactly 4/6 runs hon (overthrow ke 5/7 boundary nahi gine jate)
- Super over aur DLS abhi nahi hain
- DB migrations ke liye Alembic abhi add nahi hua (tables `create_all` se bante hain)
