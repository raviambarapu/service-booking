-- PostgreSQL schema (same as the Alembic migration backend/alembic/versions/0001_initial.py)
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE slots (
    id         SERIAL PRIMARY KEY,
    start_time TIMESTAMP NOT NULL,
    end_time   TIMESTAMP NOT NULL CHECK (end_time > start_time),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_slot_time UNIQUE (start_time, end_time)
);
CREATE INDEX ix_slots_start_time ON slots (start_time);

CREATE TABLE bookings (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users (id),
    slot_id    INTEGER NOT NULL REFERENCES slots (id),
    status     VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled', 'completed')),
    notes      VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ix_bookings_user_id ON bookings (user_id);
CREATE INDEX ix_bookings_slot_id ON bookings (slot_id);
-- one ACTIVE booking per slot (prevents double booking)
CREATE UNIQUE INDEX uq_active_booking_per_slot ON bookings (slot_id) WHERE status = 'booked';
