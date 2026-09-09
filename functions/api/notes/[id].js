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

  // Um tema "chapéu" só agrupa outros temas — não pode acolher notas
  // diretamente, só os temas filhos (ou nenhum tema, "Geral").
  if (topicId && topicId !== note.topic_id) {
    const isHeader = await env.DB.prepare(
      'SELECT 1 FROM note_topics WHERE parent_id = ? AND user_id = ? LIMIT 1'
    ).bind(topicId, user.id).first();
    if (isHeader) return badRequest('Este tema é um agrupador — escolhe um dos seus subtemas');
  }

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

  // A linha em note_attachments cai sozinha com o ON DELETE CASCADE, mas o
  // objeto no R2 não — sem isto, apagar a nota deixava ficheiros órfãos.
  const { results: attachments } = await env.DB.prepare(
    'SELECT r2_key FROM note_attachments WHERE note_id = ? AND user_id = ?'
  ).bind(params.id, user.id).all();
  await Promise.all(attachments.map(a => env.ATTACHMENTS.delete(a.r2_key)));

  await env.DB.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id).run();

  return json({ ok: true });
}