-- 0003_note_topics_hierarchy.sql — permitir agrupar temas sob um tema "chapéu"
-- (um nível de hierarquia: um tema pode ter um tema pai, que por sua vez não
-- tem pai). Ver nota de tolerância em 0001 — o deploy ignora o erro se a
-- coluna já existir.
ALTER TABLE note_topics ADD COLUMN parent_id TEXT REFERENCES note_topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_note_topics_parent ON note_topics(parent_id);
