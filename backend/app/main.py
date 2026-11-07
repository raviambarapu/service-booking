import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routers import auth, bookings, slots
from .seed import seed_admin

logger = logging.getLogger("booking")

app = FastAPI(
    title="Service Booking API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS is only needed if the frontend runs on a different origin.
# (Locally Vite proxies /api, and on Vercel both share one domain.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(slots.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


try:  # make sure the admin account exists (tables must already be migrated)
    seed_admin()
except Exception as exc:  # pragma: no cover
    logger.warning("Admin seed skipped: %s", exc)
