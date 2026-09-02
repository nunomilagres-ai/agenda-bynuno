// GET  /api/notes          — listar notas do utilizador (filtro opcional: ?topic_id=xxx)
// POST /api/notes          — criar nota
import { getAuthUser, unauthorized, badRequest, json, gid } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const url      = new URL(request.url);
  const topicId  = url.searchParams.get('topic_id'); // null = todas
  const search   = (url.searchParams.get('q') || '').trim();

  let query, bindings;

  if (topicId === 'null' || topicId === 'none') {
    // Notas sem tema (Geral)
    query = `SELECT id, topic_id, title, content, pinned, created_date, updated_date
             FROM notes
             WHERE user_id = ? AND topic_id IS NULL
             ORDER BY pinned DESC, updated_date DESC`;
    bindings = [user.id];
  } else if (topicId) {
    query = `SELECT id, topic_id, title, content, pinned, created_date, updated_date
             FROM notes
             WHERE user_id = ? AND topic_id = ?
             ORDER BY pinned DESC, updated_date DESC`;
    bindings = [user.id, topicId];
  } else {
    query = `SELECT id, topic_id, title, content, pinned, created_date, updated_date
             FROM notes
             WHERE user_id = ?
             ORDER BY pinned DESC, updated_date DESC`;
    bindings = [user.id];
  }

  let { results } = await env.DB.prepare(query).bind(...bindings).all();

  // Filtro de pesquisa no servidor (D1 não suporta FTS no plano free)
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(n =>
      (n.title   || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    );
  }

  // Não devolver content completo na listagem — poupar largura de banda
  const list = results.map(({ content, ...rest }) => ({
    ...rest,
    excerpt: (content || '').replace(/#+\s|[*`>#\-]/g, '').slice(0, 80),
  }));

  return json(list);
}

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const id      = body.id || gid();
  const ts      = now();
  const title   = (body.title   || 'Nova nota').trim();
  const content = body.content  || '';
  const topicId = body.topic_id || null;
  const pinned  = body.pinned   ? 1 : 0;

  await env.DB.prepare(
    `INSERT INTO notes (id, user_id, topic_id, title, content, pinned, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, topicId, title, content, pinned, ts, ts).run();

  return json({ id, topic_id: topicId, title, content, pinned, created_date: ts, updated_date: ts }, 201);
}