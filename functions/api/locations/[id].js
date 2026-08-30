// PUT    /api/locations/:id — editar localização (nome, cor, sort_order)
// DELETE /api/locations/:id — apagar localização
import { getAuthUser, unauthorized, badRequest, notFound, json } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const loc = await env.DB.prepare(
    'SELECT * FROM locations WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!loc) return notFound();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const name      = (body.name  ?? loc.name).trim();
  const color     = body.color  ?? loc.color;
  const sortOrder = body.sort_order !== undefined ? body.sort_order : loc.sort_order;

  if (!name) return badRequest('Nome é obrigatório');

  const ts = now();
  await env.DB.prepare(
    `UPDATE locations SET name = ?, color = ?, sort_order = ?, updated_date = ?
     WHERE id = ? AND user_id = ?`
  ).bind(name, color, sortOrder, ts, params.id, user.id).run();

  return json({ id: params.id, name, color, sort_order: sortOrder, updated_date: ts });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const loc = await env.DB.prepare(
    'SELECT id FROM locations WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!loc) return notFound();

  // location_periods (CASCADE) são apagados; eventos ligados ficam com location_id = NULL
  await env.DB.prepare(
    'DELETE FROM locations WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).run();

  return json({ ok: true });
}
