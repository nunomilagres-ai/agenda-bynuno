// GET  /api/events?start=YYYY-MM-DD&end=YYYY-MM-DD — eventos que sobrepõem o intervalo
// POST /api/events — criar evento
import { getAuthUser, unauthorized, badRequest, json, gid } from '../../_auth.js';
import { expandEvent, RECURRENCE_FREQS } from '../../_recurrence.js';

function now() { return new Date().toISOString(); }

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  let query = `
    SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime, e.all_day,
           e.location_id, e.recurrence_freq, e.recurrence_until, e.event_type,
           l.name AS location_name, l.color AS location_color
    FROM events e
    LEFT JOIN locations l ON l.id = e.location_id
    WHERE e.user_id = ?`;
  const binds = [user.id];

  if (start && end) {
    // Não recorrente: a data original tem de sobrepor o intervalo pedido.
    // Recorrente: a série tem de já ter começado e ainda não ter terminado.
    query += ` AND (
      (e.recurrence_freq IS NULL AND substr(e.start_datetime,1,10) <= ? AND substr(e.end_datetime,1,10) >= ?)
      OR
      (e.recurrence_freq IS NOT NULL AND substr(e.start_datetime,1,10) <= ? AND (e.recurrence_until IS NULL OR e.recurrence_until >= ?))
    )`;
    binds.push(end, start, end, start);
  }
  query += ' ORDER BY e.start_datetime ASC';

  const { results } = await env.DB.prepare(query).bind(...binds).all();

  let events = results;
  if (start && end) {
    const recurringIds = results.filter(e => e.recurrence_freq && e.event_type !== 'birthday').map(e => e.id);
    const exceptionsByEvent = {};
    if (recurringIds.length) {
      const placeholders = recurringIds.map(() => '?').join(',');
      const { results: exRows } = await env.DB.prepare(
        `SELECT ex.*, l.name AS location_name, l.color AS location_color
         FROM event_exceptions ex LEFT JOIN locations l ON l.id = ex.location_id
         WHERE ex.event_id IN (${placeholders})`
      ).bind(...recurringIds).all();
      for (const ex of exRows) {
        (exceptionsByEvent[ex.event_id] ??= {})[ex.occurrence_date] = ex;
      }
    }
    events = results
      .flatMap(e => expandEvent(e, exceptionsByEvent[e.id], start, end))
      .sort((a, b) => (a.start_datetime < b.start_datetime ? -1 : 1));
  }

  return json(events);
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

  const eventType = ['birthday', 'vacation'].includes(body.event_type) ? body.event_type : null;

  let recurrenceFreq = eventType === 'birthday' ? 'yearly' : (body.recurrence_freq || null);
  if (recurrenceFreq && !RECURRENCE_FREQS.includes(recurrenceFreq)) {
    return badRequest('recurrence_freq inválida');
  }
  const recurrenceUntil = eventType === 'birthday' ? null : (recurrenceFreq ? (body.recurrence_until || null) : null);

  const id = gid();
  const ts = now();
  const allDay = body.all_day ? 1 : 0;
  const description = body.description || null;

  await env.DB.prepare(
    `INSERT INTO events (id, user_id, title, description, start_datetime, end_datetime, all_day, location_id, recurrence_freq, recurrence_until, event_type, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, title, description, startDatetime, endDatetime, allDay, locationId, recurrenceFreq, recurrenceUntil, eventType, ts, ts).run();

  return json({
    id, title, description, start_datetime: startDatetime, end_datetime: endDatetime,
    all_day: allDay, location_id: locationId, recurrence_freq: recurrenceFreq, recurrence_until: recurrenceUntil,
    event_type: eventType, created_date: ts, updated_date: ts,
  }, 201);
}
