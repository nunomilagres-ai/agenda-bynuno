// GET  /api/notes/:id/attachments — listar anexos de uma nota (metadados, sem bytes)
// POST /api/notes/:id/attachments — enviar um novo anexo (multipart/form-data, campo "file")
import { getAuthUser, unauthorized, badRequest, notFound, json, gid } from '../../../_auth.js';

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB — generoso para PDFs/fotos, sem abrir a porta a ficheiros enormes

function now() { return new Date().toISOString(); }

async function ownedNote(env, noteId, userId) {
  return env.DB.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').bind(noteId, userId).first();
}

export async function onRequestGet({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  if (!(await ownedNote(env, params.id, user.id))) return notFound('Nota não encontrada');

  const { results } = await env.DB.prepare(
    `SELECT id, note_id, filename, content_type, size_bytes, created_date
     FROM note_attachments WHERE note_id = ? AND user_id = ? ORDER BY created_date ASC`
  ).bind(params.id, user.id).all();

  return json(results);
}

export async function onRequestPost({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  if (!(await ownedNote(env, params.id, user.id))) return notFound('Nota não encontrada');

  let form;
  try { form = await request.formData(); } catch { return badRequest('Pedido inválido'); }

  const file = form.get('file');
  if (!file || typeof file === 'string') return badRequest('Ficheiro em falta');
  if (file.size === 0) return badRequest('Ficheiro vazio');
  if (file.size > MAX_SIZE) return badRequest(`Ficheiro demasiado grande (máx. ${MAX_SIZE / 1024 / 1024} MB)`);

  const id = gid();
  const ts = now();
  const safeName = (file.name || 'anexo').replace(/[/\\]/g, '_');
  const r2Key = `${user.id}/${params.id}/${id}-${safeName}`;

  await env.ATTACHMENTS.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  await env.DB.prepare(
    `INSERT INTO note_attachments (id, user_id, note_id, filename, content_type, size_bytes, r2_key, created_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, params.id, safeName, file.type || null, file.size, r2Key, ts).run();

  return json({ id, note_id: params.id, filename: safeName, content_type: file.type || null, size_bytes: file.size, created_date: ts }, 201);
}
