// PUT    /api/events/:id/occurrence/:date — editar (ou criar exceção para) uma única ocorrência
// DELETE /api/events/:id/occurrence/:date — remover uma única ocorrência da série
//
// :id é sempre o evento real (a série); :date é a occurrence_date original
// (calculada pelo padrão de recorrência, ver functions/_recurrence.js).
// Nunca aplicável a event_type = 'birthday'.
import { getAuthUser, unauthorized, badRequest, notFound, json, gid } from '../../../../_auth.js';

function now() { return new Date().toISOString(); }

async function loadSeries(env, id, userId) {
  return env.DB.prepare('SELECT * FROM events WHERE id = ? AND user_id = ?').bind(id, userId).first();
}

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const event = await loadSeries(env, params.id, user.id);
  if (!event) return notFound();
  if (event.event_type === 'birthday') return badRequest('Um aniversário não suporta edição de uma ocorrência isolada — edita a série.');
  if (!event.recurrence_freq) return badRequest('Este evento não é recorrente.');

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
    const loc = await env.DB.prepare('SELECT id FROM locations WHERE id = ? AND user_id = ?').bind(locationId, user.id).first();
    if (!loc) locationId = null;
  }

  const occurrenceDate = params.date;
  const existing = await env.DB.prepare(
    'SELECT id FROM event_exceptions WHERE event_id = ? AND occurrence_date = ?'
  ).bind(params.id, occurrenceDate).first();

  const ts = now();
  if (existing) {
    await env.DB.prepare(
      `UPDATE event_exceptions SET deleted = 0, title = ?, description = ?, start_datetime = ?,
       end_datetime = ?, all_day = ?, location_id = ?, updated_date = ? WHERE id = ?`
    ).bind(title, description, startDatetime, endDatetime, allDay, locationId, ts, existing.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO event_exceptions (id, event_id, occurrence_date, deleted, title, description, start_datetime, end_datetime, all_day, location_id, created_date, updated_date)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(gid(), params.id, occurrenceDate, title, description, startDatetime, endDatetime, allDay, locationId, ts, ts).run();
  }

  return json({
    id: `${params.id}::${occurrenceDate}`, occurrence_date: occurrenceDate,
    title, description, start_datetime: startDatetime, end_datetime: endDatetime,
    all_day: allDay, location_id: locationId, updated_date: ts,
  });
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const event = await loadSeries(env, params.id, user.id);
  if (!event) return notFound();
  if (event.event_type === 'birthday') return badRequest('Um aniversário não suporta eliminação de uma ocorrência isolada — apaga a série.');

  const occurrenceDate = params.date;
  const existing = await env.DB.prepare(
    'SELECT id FROM event_exceptions WHERE event_id = ? AND occurrence_date = ?'
  ).bind(params.id, occurrenceDate).first();

  const ts = now();
  if (existing) {
    await env.DB.prepare('UPDATE event_exceptions SET deleted = 1, updated_date = ? WHERE id = ?').bind(ts, existing.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO event_exceptions (id, event_id, occurrence_date, deleted, created_date, updated_date) VALUES (?, ?, ?, 1, ?, ?)`
    ).bind(gid(), params.id, occurrenceDate, ts, ts).run();
  }

  return json({ ok: true });
}
