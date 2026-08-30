// PUT    /api/location-periods/:id — editar datas/localização de um período
// DELETE /api/location-periods/:id — apagar período
import { getAuthUser, unauthorized, badRequest, notFound, json } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const period = await env.DB.prepare(
    'SELECT * FROM location_periods WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!period) return notFound();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const locationId = body.location_id ?? period.location_id;
  const startDate = body.start_date ?? period.start_date;
  const endDate = body.end_date ?? period.end_date;
  if (endDate < startDate) return badRequest('end_date não pode ser anterior a start_date');

  const ts = now();
  await env.DB.prepare(
    `UPDATE location_periods SET location_id = ?, start_date = ?, end_date = ?, updated_date = ?
     WHERE id = ? AND user_id = ?`
  ).bind(locationId, startDate, endDate, ts, params.id, user.id).run();

  return json({ id: params.id, location_id: locationId, start_date: startDate, end_date: endDate, updated_date: ts });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const period = await env.DB.prepare(
    'SELECT id FROM location_periods WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!period) return notFound();

  await env.DB.prepare(
    'DELETE FROM location_periods WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).run();

  return json({ ok: true });
}
