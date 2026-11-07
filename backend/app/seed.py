from sqlalchemy import select

from .config import ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
from .database import SessionLocal
from .models import User
from .security import hash_password


def seed_admin() -> None:
    """Create the default admin account if it does not exist."""
    with SessionLocal() as db:
        exists = db.scalar(select(User).where(User.email == ADMIN_EMAIL.lower()))
        if not exists:
            db.add(User(name=ADMIN_NAME, email=ADMIN_EMAIL.lower(),
                        password_hash=hash_password(ADMIN_PASSWORD), role="admin"))
            db.commit()


if __name__ == "__main__":
    seed_admin()
    print("Admin ready:", ADMIN_EMAIL)
