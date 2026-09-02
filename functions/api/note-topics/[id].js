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

  if (!name) return badRequest('Nome é obrigatório');

  const ts = now();
  await env.DB.prepare(
    `UPDATE note_topics SET name = ?, emoji = ?, color = ?, sort_order = ?, updated_date = ?
     WHERE id = ? AND user_id = ?`
  ).bind(name, emoji, color, sortOrder, ts, params.id, user.id).run();

  return json({ id: params.id, name, emoji, color, sort_order: sortOrder, updated_date: ts });
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