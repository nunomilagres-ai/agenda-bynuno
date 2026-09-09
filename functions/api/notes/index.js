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
    // Um tema "chapéu" traz também as notas dos temas que agrupa — o cliente
    // manda o próprio id mais os dos filhos, separados por vírgula.
    const ids = topicId.split(',').filter(Boolean);
    query = `SELECT id, topic_id, title, content, pinned, created_date, updated_date
             FROM notes
             WHERE user_id = ? AND topic_id IN (${ids.map(() => '?').join(',')})
             ORDER BY pinned DESC, updated_date DESC`;
    bindings = [user.id, ...ids];
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

  // Um tema "chapéu" só agrupa outros temas — não pode acolher notas
  // diretamente, só os temas filhos (ou nenhum tema, "Geral").
  if (topicId) {
    const isHeader = await env.DB.prepare(
      'SELECT 1 FROM note_topics WHERE parent_id = ? AND user_id = ? LIMIT 1'
    ).bind(topicId, user.id).first();
    if (isHeader) return badRequest('Este tema é um agrupador — escolhe um dos seus subtemas');
  }

  await env.DB.prepare(
    `INSERT INTO notes (id, user_id, topic_id, title, content, pinned, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, topicId, title, content, pinned, ts, ts).run();

  return json({ id, topic_id: topicId, title, content, pinned, created_date: ts, updated_date: ts }, 201);
}