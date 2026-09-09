// PUT    /api/note-topics/:id — editar tema (nome, emoji, cor, sort_order)
// DELETE /api/note-topics/:id — apagar tema
import { getAuthUser, unauthorized, badRequest, notFound, json } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const topic = await env.DB.prepare(
    'SELECT * FROM note_topics WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!topic) return notFound();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const name      = (body.name  ?? topic.name).trim();
  const emoji     = body.emoji  ?? topic.emoji;
  const color     = body.color  ?? topic.color;
  const sortOrder = body.sort_order !== undefined ? body.sort_order : topic.sort_order;
  const parentId  = body.parent_id !== undefined ? (body.parent_id || null) : topic.parent_id;

  if (!name) return badRequest('Nome é obrigatório');

  // Só um nível de hierarquia, e sem ciclos: não pode ser pai de si próprio,
  // o pai indicado não pode ter ele próprio um pai, e nenhum tema que já
  // tenha filhos pode passar a ter um pai (ficaria com 3 níveis).
  if (parentId) {
    if (parentId === params.id) return badRequest('Um tema não pode ser pai de si próprio');
    const parent = await env.DB.prepare(
      'SELECT id, parent_id FROM note_topics WHERE id = ? AND user_id = ?'
    ).bind(parentId, user.id).first();
    if (!parent || parent.parent_id) return badRequest('Tema pai inválido');
    const hasChildren = await env.DB.prepare(
      'SELECT 1 FROM note_topics WHERE parent_id = ? AND user_id = ? LIMIT 1'
    ).bind(params.id, user.id).first();
    if (hasChildren) return badRequest('Este tema já agrupa outros temas — não pode também ter um pai');
  }

  const ts = now();
  await env.DB.prepare(
    `UPDATE note_topics SET name = ?, emoji = ?, color = ?, sort_order = ?, parent_id = ?, updated_date = ?
     WHERE id = ? AND user_id = ?`
  ).bind(name, emoji, color, sortOrder, parentId, ts, params.id, user.id).run();

  return json({ id: params.id, name, emoji, color, sort_order: sortOrder, parent_id: parentId, updated_date: ts });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const topic = await env.DB.prepare(
    'SELECT id FROM note_topics WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!topic) return notFound();

  // Notas deste tema ficam com topic_id = NULL (ON DELETE SET NULL no schema)
  await env.DB.prepare(
    'DELETE FROM note_topics WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).run();

  return json({ ok: true });
}