"""initial schema: users, slots, bookings

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "slots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("start_time", sa.DateTime, nullable=False),
        sa.Column("end_time", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("start_time", "end_time", name="uq_slot_time"),
    )
    op.create_index("ix_slots_start_time", "slots", ["start_time"])

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("slot_id", sa.Integer, sa.ForeignKey("slots.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="booked"),
        sa.Column("notes", sa.String(300)),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_slot_id", "bookings", ["slot_id"])
    op.create_index(
        "uq_active_booking_per_slot", "bookings", ["slot_id"], unique=True,
        postgresql_where=sa.text("status = 'booked'"),
    )


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("slots")
    op.drop_table("users")
