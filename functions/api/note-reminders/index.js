// GET  /api/note-reminders — listar lembretes do utilizador
// POST /api/note-reminders — criar lembrete (+ gerar ocorrências futuras se recorrente)
import { getAuthUser, unauthorized, badRequest, json, gid } from '../../_auth.js'

function now() { return new Date().toISOString() }

function addInterval(isoDate, recurrence) {
  const d = new Date(isoDate)
  switch (recurrence) {
    case 'daily':   d.setDate(d.getDate() + 1);          break
    case 'weekly':  d.setDate(d.getDate() + 7);          break
    case 'monthly': d.setMonth(d.getMonth() + 1);        break
    case 'yearly':  d.setFullYear(d.getFullYear() + 1);  break
    default: return null
  }
  return d.toISOString().slice(0, 16)
}

/**
 * Generate all future occurrences for a recurring reminder.
 * Stops at: recurrence_end_date OR recurrence_count occurrences OR 2 years (safety cap).
 */
function generateOccurrences(parentId, userId, base, recurrence, endDate, maxCount) {
  const items = []
  const cap = new Date()
  cap.setFullYear(cap.getFullYear() + 2) // 2-year safety cap

  let current = base.due_date
  let idx = 1
  const limit = maxCount || 999

  while (idx <= limit) {
    const next = addInterval(current, recurrence)
    if (!next) break

    const d = new Date(next)
    if (endDate && d > new Date(endDate)) break
    if (d > cap) break

    items.push({
      id: gid(),
      user_id: userId,
      note_id: base.note_id || null,
      title: base.title,
      body: base.body || null,
      due_date: next,
      completed: 0,
      notified: 0,
      recurrence,
      recurrence_end_date: endDate || null,
      recurrence_count: maxCount || null,
      recurrence_parent_id: parentId,
      recurrence_index: idx,
    })
    current = next
    idx++
  }
  return items
}

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()

  const url       = new URL(request.url)
  const completed = url.searchParams.get('completed')

  let query
  const bindings = [user.id]

  if (completed === '0') {
    query = `SELECT r.*, n.title AS note_title
             FROM note_reminders r LEFT JOIN notes n ON n.id = r.note_id
             WHERE r.user_id = ? AND r.completed = 0 ORDER BY r.due_date ASC`
  } else if (completed === '1') {
    query = `SELECT r.*, n.title AS note_title
             FROM note_reminders r LEFT JOIN notes n ON n.id = r.note_id
             WHERE r.user_id = ? AND r.completed = 1 ORDER BY r.due_date DESC`
  } else {
    query = `SELECT r.*, n.title AS note_title
             FROM note_reminders r LEFT JOIN notes n ON n.id = r.note_id
             WHERE r.user_id = ? ORDER BY r.completed ASC, r.due_date ASC`
  }

  const { results } = await env.DB.prepare(query).bind(...bindings).all()
  return json(results)
}

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()

  let body
  try { body = await request.json() } catch { return badRequest('JSON inválido') }

  const title       = (body.title || '').trim()
  const due_date    = (body.due_date || '').trim()
  const recurrence  = body.recurrence || null
  const endDate     = body.recurrence_end_date || null
  const maxCount    = body.recurrence_count ? parseInt(body.recurrence_count) : null

  if (!title)    return badRequest('Título é obrigatório')
  if (!due_date) return badRequest('Data é obrigatória')

  const id = gid()
  const ts = now()
  const noteId = body.note_id || null
  const bBody  = body.body    || null

  const base = { title, body: bBody, note_id: noteId, due_date }

  await env.DB.prepare(
    `INSERT INTO note_reminders (id, user_id, note_id, title, body, due_date, completed, notified,
      recurrence, recurrence_end_date, recurrence_count, recurrence_parent_id, recurrence_index,
      created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, NULL, 0, ?, ?)`
  ).bind(id, user.id, noteId, title, bBody, due_date, recurrence, endDate, maxCount, ts, ts).run()

  // Pre-generate future occurrences
  if (recurrence) {
    const occurrences = generateOccurrences(id, user.id, base, recurrence, endDate, maxCount)
    for (const occ of occurrences) {
      await env.DB.prepare(
        `INSERT INTO note_reminders (id, user_id, note_id, title, body, due_date, completed, notified,
          recurrence, recurrence_end_date, recurrence_count, recurrence_parent_id, recurrence_index,
          created_date, updated_date)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(occ.id, occ.user_id, occ.note_id, occ.title, occ.body, occ.due_date, occ.recurrence,
             occ.recurrence_end_date, occ.recurrence_count, occ.recurrence_parent_id, occ.recurrence_index,
             ts, ts).run()
    }
  }

  return json({ id, note_id: noteId, title, body: bBody, due_date, completed: 0, notified: 0,
    recurrence, recurrence_end_date: endDate, recurrence_count: maxCount,
    recurrence_parent_id: null, recurrence_index: 0, created_date: ts, updated_date: ts }, 201)
}
