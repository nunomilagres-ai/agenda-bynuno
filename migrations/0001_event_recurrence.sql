-- 0001_event_recurrence.sql — adiciona recorrência a eventos já existentes em produção.
-- Executado a cada deploy (ver .github/workflows/deploy.yml); falha de forma
-- tolerada se as colunas já existirem (ALTER TABLE ADD COLUMN não é idempotente
-- em SQLite/D1).
ALTER TABLE events ADD COLUMN recurrence_freq TEXT;
ALTER TABLE events ADD COLUMN recurrence_until TEXT;
