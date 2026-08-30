// GET    /api/events/:id — detalhe de um evento
// PUT    /api/events/:id — editar evento
// DELETE /api/events/:id — apagar evento
import { getAuthUser, unauthorized, badRequest, notFound, json } from '../../_auth.js';
import { RECURRENCE_FREQS } from '../../_recurrence.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const event = await env.DB.prepare(
    `SELECT e.*, l.name AS location_name, l.color AS location_color
     FROM events e LEFT JOIN locations l ON l.id = e.location_id
     WHERE e.id = ? AND e.user_id = ?`
  ).bind(params.id, user.id).first();
  if (!event) return notFound();

  return json(event);
}

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const event = await env.DB.prepare(
    'SELECT * FROM events WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!event) return notFound();

  let body;
  try { body = await request.json(); } catch { return badRequest('JSON inválido'); }

  const title = (body.title ?? event.title).trim();
  if (!title) return badRequest('Título é obrigatório');

  const startDatetime = body.start_datetime ?? event.start_datetime;
  const endDatetime = body.end_datetime ?? event.end_datetime;
  if (endDatetime < startDatetime) return badRequest('end_datetime não pode ser anterior a start_datetime');

  const description = body.description !== undefined ? body.description : event.description;
  const allDay = body.all_day !== undefined ? (body.all_day ? 1 : 0) : event.all_day;

  let locationId = body.location_id !== undefined ? body.location_id : event.location_id;
  if (locationId) {
    const loc = await env.DB.prepare(
      'SELECT id FROM locations WHERE id = ? AND user_id = ?'
    ).bind(locationId, user.id).first();
    if (!loc) locationId = null;
  }

  let recurrenceFreq = body.recurrence_freq !== undefined ? body.recurrence_freq : event.recurrence_freq;
  if (recurrenceFreq && !RECURRENCE_FREQS.includes(recurrenceFreq)) {
    return badRequest('recurrence_freq inválida');
  }
  const recurrenceUntil = recurrenceFreq
    ? (body.recurrence_until !== undefined ? body.recurrence_until : event.recurrence_until)
    : null;

  const ts = now();
  await env.DB.prepare(
    `UPDATE events SET title = ?, description = ?, start_datetime = ?, end_datetime = ?,
     all_day = ?, location_id = ?, recurrence_freq = ?, recurrence_until = ?, updated_date = ?
     WHERE id = ? AND user_id = ?`
  ).bind(title, description, startDatetime, endDatetime, allDay, locationId, recurrenceFreq, recurrenceUntil, ts, params.id, user.id).run();

  return json({
    id: params.id, title, description, start_datetime: startDatetime, end_datetime: endDatetime,
    all_day: allDay, location_id: locationId, recurrence_freq: recurrenceFreq, recurrence_until: recurrenceUntil,
    updated_date: ts,
  });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const event = await env.DB.prepare(
    'SELECT id FROM events WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!event) return notFound();

  await env.DB.prepare(
    'DELETE FROM events WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).run();

  return json({ ok: true });
}
