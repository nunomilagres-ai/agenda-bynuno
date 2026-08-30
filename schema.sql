-- schema.sql — agenda.bynuno.com D1 database

-- ─── Utilizadores (sync com bynuno.com hub) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  avatar_url   TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Localizações (Porto, Lisboa, Vila Real, ...) ────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#2563EB',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);

-- ─── Períodos de localização (dias em que estou em cada sítio) ──────────────
-- Tinge as células do calendário no intervalo [start_date, end_date] (inclusive).
CREATE TABLE IF NOT EXISTS location_periods (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id  TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  start_date   TEXT NOT NULL,  -- YYYY-MM-DD
  end_date     TEXT NOT NULL,  -- YYYY-MM-DD (inclusive)
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_location_periods_user  ON location_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_location_periods_range ON location_periods(start_date, end_date);

-- ─── Eventos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  start_datetime TEXT NOT NULL,  -- ISO: YYYY-MM-DDTHH:MM
  end_datetime   TEXT NOT NULL,
  all_day        INTEGER NOT NULL DEFAULT 0,
  location_id    TEXT REFERENCES locations(id) ON DELETE SET NULL,
  created_date   TEXT NOT NULL,
  updated_date   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_user  ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
