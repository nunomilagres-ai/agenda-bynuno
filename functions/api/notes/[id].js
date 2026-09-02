// GET    /api/notes/:id — obter nota completa (com content)
// PUT    /api/notes/:id — editar nota
// DELETE /api/notes/:id — apagar nota
import { getAuthUser, unauthorized, badRequest, notFound, json } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const note = await env.DB.prepare(
    `SELECT id, topic_id, title, content, pinned, created_date, updated_date
     FROM notes WHERE id = ? AND user_id = ?`
  ).bind(params.id, user.id).first();

  if (!note) return notFound();
  return json(note);
}

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const note = await env.DB.prepare(
    'SELECT * FROM notes WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!note) return notFound();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const title   = body.title    !== undefined ? (body.title || '').trim() : note.title;
  const content = body.content  !== undefined ? body.content              : note.content;
  const topicId = body.topic_id !== undefined ? (body.topic_id || null)   : note.topic_id;
  const pinned  = body.pinned   !== undefined ? (body.pinned ? 1 : 0)     : note.pinned;

  const ts = now();
  await env.DB.prepare(
    `UPDATE notes SET title = ?, content = ?, topic_id = ?, pinned = ?, updated_date = ?
     WHERE id = ? AND user_id = ?`
  ).bind(title, content, topicId, pinned, ts, params.id, user.id).run();

  return json({ id: params.id, topic_id: topicId, title, content, pinned, updated_date: ts });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const note = await env.DB.prepare(
    'SELECT id FROM notes WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!note) return notFound();

  await env.DB.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id).run();

  return json({ ok: true });
}