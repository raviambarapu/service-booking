# BookIt – Service Booking Full-Stack Application

Appointment-booking app for a clinic / service center.
Users register, log in, view available slots, create / reschedule / cancel bookings and see their history.
Admins manage slots and all bookings.

**Stack:** React (Vite) · FastAPI · PostgreSQL · SQLAlchemy · Alembic · JWT (PyJWT + bcrypt) · pytest · Vitest

## Features
- Register / login with JWT, passwords hashed with bcrypt
- Role checks: `user` and `admin` (admin-only endpoints return 403 for users)
- Slots: admin creates / deletes; users see only upcoming, available slots
- Bookings: create, reschedule, cancel, personal history
- Double-booking is impossible: a partial unique index (`slot_id WHERE status='booked'`) enforces it in the database
- Validation: Pydantic on the API (email, password length, slot times, notes length) + HTML validation in the UI
- Responsive UI (works on phone and desktop)

## Project structure
```
service-booking/
├── api/index.py              # Vercel serverless entry (exposes FastAPI app)
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, routers
│   │   ├── config.py         # reads .env
│   │   ├── database.py       # SQLAlchemy engine/session
│   │   ├── models.py         # User, Slot, Booking
│   │   ├── schemas.py        # Pydantic validation
│   │   ├── security.py       # bcrypt + JWT
│   │   ├── deps.py           # get_db, get_current_user, require_admin
│   │   ├── seed.py           # creates default admin
│   │   └── routers/ auth.py, slots.py, bookings.py
│   ├── alembic/              # DB migrations (0001_initial.py)
│   ├── tests/                # API tests (pytest)
│   ├── .env.example
│   └── requirements-dev.txt
├── frontend/
│   ├── src/ (pages, components, AuthContext, api.js, tests)
│   ├── .env
│   └── vite.config.js        # proxies /api -> localhost:8000
├── database/schema.sql       # plain SQL version of the schema
├── requirements.txt          # production Python deps (used by Vercel)
└── vercel.json
```

## API
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET | /api/auth/me | logged in |
| GET | /api/slots?available_only=true | logged in |
| POST | /api/slots | admin |
| DELETE | /api/slots/{id} | admin |
| POST | /api/bookings | logged in |
| GET | /api/bookings/my | logged in |
| PUT | /api/bookings/{id}/reschedule | owner / admin |
| DELETE | /api/bookings/{id} (cancel) | owner / admin |
| GET | /api/bookings | admin |
| PATCH | /api/bookings/{id}/status | admin |

Interactive docs: http://localhost:8000/docs

## Run locally
**1. Database** – create a PostgreSQL database named `booking_db`, then edit `backend/.env`
(`DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/booking_db`).

**2. Backend**
```bash
cd service-booking
python -m venv .venv
.venv\Scripts\activate            # Windows   (Mac/Linux: source .venv/bin/activate)
pip install -r backend/requirements-dev.txt
cd backend
alembic upgrade head              # create tables
uvicorn app.main:app --reload     # http://localhost:8000
```
The admin account from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) is created automatically on startup.

**3. Frontend** (new terminal)
```bash
cd service-booking/frontend
npm install
npm run dev                       # http://localhost:5173
```

## Tests
```bash
cd backend && pytest              # 14 API tests (SQLite, no setup needed)
cd frontend && npm test           # UI tests (Vitest + Testing Library)
```

## Deploy on Vercel
1. Create a free PostgreSQL DB (Neon / Supabase / Vercel Postgres). Copy the connection string (must include `?sslmode=require`).
2. Create the tables once from your computer: set `DATABASE_URL` in `backend/.env` to that string, then run `cd backend && alembic upgrade head`.
3. Push the project to GitHub, import it in Vercel (Framework Preset: **Other**, Root Directory: repo root).
4. Add Environment Variables: `DATABASE_URL`, `SECRET_KEY`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
5. Deploy. Frontend is served at `/`, API at `/api/*` (same domain, so no CORS issues).
