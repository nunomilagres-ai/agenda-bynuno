// GET  /api/note-topics — listar temas do utilizador
// POST /api/note-topics — criar tema
import { getAuthUser, unauthorized, badRequest, json, gid } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const { results } = await env.DB.prepare(
    `SELECT id, name, emoji, color, sort_order, created_date, updated_date
     FROM note_topics
     WHERE user_id = ?
     ORDER BY sort_order ASC, created_date ASC`
  ).bind(user.id).all();

  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const name = (body.name || '').trim();
  if (!name) return badRequest('Nome é obrigatório');

  // Obter sort_order máximo atual
  const max = await env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) AS m FROM note_topics WHERE user_id = ?'
  ).bind(user.id).first();

  const id = gid();
  const ts = now();
  const emoji = body.emoji || '📋';
  const color = body.color || '#E8A838';
  const sortOrder = (max?.m ?? -1) + 1;

  await env.DB.prepare(
    `INSERT INTO note_topics (id, user_id, name, emoji, color, sort_order, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, name, emoji, color, sortOrder, ts, ts).run();

  return json({ id, name, emoji, color, sort_order: sortOrder, created_date: ts, updated_date: ts }, 201);
}