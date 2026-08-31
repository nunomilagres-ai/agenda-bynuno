-- 0002_event_exceptions.sql — tipo de evento (aniversário) + exceções por ocorrência,
-- para eventos já existentes em produção. Ver nota de tolerância em 0001.
ALTER TABLE events ADD COLUMN event_type TEXT;

CREATE TABLE IF NOT EXISTS event_exceptions (
  id               TEXT PRIMARY KEY,
  event_id         TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_date  TEXT NOT NULL,
  deleted          INTEGER NOT NULL DEFAULT 0,
  title            TEXT,
  description      TEXT,
  start_datetime   TEXT,
  end_datetime     TEXT,
  all_day          INTEGER,
  location_id      TEXT REFERENCES locations(id) ON DELETE SET NULL,
  created_date     TEXT NOT NULL,
  updated_date     TEXT NOT NULL,
  UNIQUE(event_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_event_exceptions_event ON event_exceptions(event_id);
