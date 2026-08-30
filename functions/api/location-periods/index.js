// GET  /api/location-periods?start=YYYY-MM-DD&end=YYYY-MM-DD — períodos que sobrepõem o intervalo
// POST /api/location-periods — criar período (marcar "estarei em X de A a B")
import { getAuthUser, unauthorized, badRequest, json, gid } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  let query = `
    SELECT lp.id, lp.location_id, lp.start_date, lp.end_date,
           l.name AS location_name, l.color AS location_color
    FROM location_periods lp
    JOIN locations l ON l.id = lp.location_id
    WHERE lp.user_id = ?`;
  const binds = [user.id];

  if (start && end) {
    query += ' AND lp.start_date <= ? AND lp.end_date >= ?';
    binds.push(end, start);
  }
  query += ' ORDER BY lp.start_date ASC';

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const locationId = body.location_id;
  const startDate = body.start_date;
  const endDate = body.end_date || body.start_date;
  if (!locationId) return badRequest('location_id é obrigatório');
  if (!startDate) return badRequest('start_date é obrigatório');
  if (endDate < startDate) return badRequest('end_date não pode ser anterior a start_date');

  const loc = await env.DB.prepare(
    'SELECT id FROM locations WHERE id = ? AND user_id = ?'
  ).bind(locationId, user.id).first();
  if (!loc) return badRequest('Localização inválida');

  const id = gid();
  const ts = now();

  await env.DB.prepare(
    `INSERT INTO location_periods (id, user_id, location_id, start_date, end_date, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, locationId, startDate, endDate, ts, ts).run();

  return json({ id, location_id: locationId, start_date: startDate, end_date: endDate, created_date: ts, updated_date: ts }, 201);
}
