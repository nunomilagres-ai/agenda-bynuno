// GET  /api/events?start=YYYY-MM-DD&end=YYYY-MM-DD — eventos que sobrepõem o intervalo
// POST /api/events — criar evento
import { getAuthUser, unauthorized, badRequest, json, gid } from '../../_auth.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  let query = `
    SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime, e.all_day,
           e.location_id, l.name AS location_name, l.color AS location_color
    FROM events e
    LEFT JOIN locations l ON l.id = e.location_id
    WHERE e.user_id = ?`;
  const binds = [user.id];

  if (start && end) {
    query += ' AND substr(e.start_datetime,1,10) <= ? AND substr(e.end_datetime,1,10) >= ?';
    binds.push(end, start);
  }
  query += ' ORDER BY e.start_datetime ASC';

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const title = (body.title || '').trim();
  if (!title) return badRequest('Título é obrigatório');
  if (!body.start_datetime) return badRequest('start_datetime é obrigatório');

  const startDatetime = body.start_datetime;
  const endDatetime = body.end_datetime || body.start_datetime;
  if (endDatetime < startDatetime) return badRequest('end_datetime não pode ser anterior a start_datetime');

  let locationId = body.location_id || null;
  if (locationId) {
    const loc = await env.DB.prepare(
      'SELECT id FROM locations WHERE id = ? AND user_id = ?'
    ).bind(locationId, user.id).first();
    if (!loc) locationId = null;
  }

  const id = gid();
  const ts = now();
  const allDay = body.all_day ? 1 : 0;
  const description = body.description || null;

  await env.DB.prepare(
    `INSERT INTO events (id, user_id, title, description, start_datetime, end_datetime, all_day, location_id, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, title, description, startDatetime, endDatetime, allDay, locationId, ts, ts).run();

  return json({
    id, title, description, start_datetime: startDatetime, end_datetime: endDatetime,
    all_day: allDay, location_id: locationId, created_date: ts, updated_date: ts,
  }, 201);
}
