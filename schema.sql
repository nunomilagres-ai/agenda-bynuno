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
-- Recorrência: um evento recorrente é guardado como uma única linha — apenas o
-- padrão (data-âncora, frequência, fim opcional); as ocorrências são calculadas
-- em runtime (ver functions/_recurrence.js) e nunca gravadas na BD.
--
-- event_type = 'birthday': a série não suporta edição/eliminação por ocorrência
-- isolada — editar ou apagar afeta sempre a série inteira (não faz sentido um
-- aniversário ter uma exceção só num ano).
-- event_type = 'vacation' (férias): evento normal em todos os outros aspetos
-- (recorrência opcional, edição por ocorrência) — a única diferença é visual:
-- os dias que cobre ficam com o mesmo fundo usado nos feriados na grelha.
-- event_type = NULL (evento normal, recorrente ou não): cada ocorrência,
-- incluindo a primeira, é editável e apagável isoladamente — a alteração fica
-- registada em event_exceptions e não afeta as restantes ocorrências.
CREATE TABLE IF NOT EXISTS events (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  start_datetime    TEXT NOT NULL,  -- ISO: YYYY-MM-DDTHH:MM (ou YYYY-MM-DD se all_day)
  end_datetime      TEXT NOT NULL,
  all_day           INTEGER NOT NULL DEFAULT 0,
  location_id       TEXT REFERENCES locations(id) ON DELETE SET NULL,
  recurrence_freq   TEXT,  -- NULL | weekly | biweekly | every_3_weeks | monthly | yearly
  recurrence_until  TEXT,  -- YYYY-MM-DD (inclusive) ou NULL = sem fim
  event_type        TEXT,  -- NULL | birthday
  created_date      TEXT NOT NULL,
  updated_date      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_user  ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);

-- ─── Exceções a eventos recorrentes ──────────────────────────────────────────
-- Uma linha por ocorrência alterada ou removida de uma série (nunca para
-- event_type = 'birthday'). occurrence_date é sempre a data original calculada
-- pelo padrão de recorrência, mesmo que start_datetime aqui a mude.
CREATE TABLE IF NOT EXISTS event_exceptions (
  id               TEXT PRIMARY KEY,
  event_id         TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  occurrence_date  TEXT NOT NULL,  -- YYYY-MM-DD
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
