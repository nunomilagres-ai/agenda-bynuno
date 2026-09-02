// GET    /api/note-reminders/:id
// PUT    /api/note-reminders/:id — edit / mark completed (auto-creates next for recurring)
// DELETE /api/note-reminders/:id
import { getAuthUser, unauthorized, badRequest, notFound, json, gid } from '../../_auth.js'

function now() { return new Date().toISOString() }


function nextDueDate(dueDateIso, recurrence) {
  const d = new Date(dueDateIso)
  switch (recurrence) {
    case 'daily':   d.setDate(d.getDate() + 1);     break
    case 'weekly':  d.setDate(d.getDate() + 7);     break
    case 'monthly': d.setMonth(d.getMonth() + 1);   break
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break
    default:        return null
  }
  // Preserve time part if present, otherwise keep T00:00
  return d.toISOString().slice(0, 16)
}

export async function onRequestGet({ request, env, params }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()
  const r = await env.DB.prepare(
    'SELECT * FROM note_reminders WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first()
  if (!r) return notFound()
  return json(r)
}

export async function onRequestPut({ request, env, params }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()

  const reminder = await env.DB.prepare(
    'SELECT * FROM note_reminders WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first()
  if (!reminder) return notFound()

  let body
  try { body = await request.json() } catch { return badRequest('JSON inválido') }

  const title              = body.title              !== undefined ? (body.title || '').trim()          : reminder.title
  const bBody              = body.body               !== undefined ? (body.body || null)                : reminder.body
  const due_date           = body.due_date           !== undefined ? (body.due_date || '').trim()      : reminder.due_date
  const completed          = body.completed          !== undefined ? (body.completed ? 1 : 0)          : reminder.completed
  const noteId             = body.note_id            !== undefined ? (body.note_id || null)             : reminder.note_id
  const recurrence         = body.recurrence         !== undefined ? (body.recurrence || null)          : reminder.recurrence
  const recurrenceEndDate  = body.recurrence_end_date !== undefined ? (body.recurrence_end_date || null) : reminder.recurrence_end_date
  const recurrenceCount    = body.recurrence_count   !== undefined ? (body.recurrence_count || null)   : reminder.recurrence_count

  if (!title)    return badRequest('Título é obrigatório')
  if (!due_date) return badRequest('Data é obrigatória')

  const ts = now()

  // Detect transition: was pending, now completed
  const justCompleted = !reminder.completed && completed === 1

  await env.DB.prepare(
    `UPDATE note_reminders
     SET title=?, body=?, due_date=?, completed=?, note_id=?, recurrence=?,
         recurrence_end_date=?, recurrence_count=?, notified=?, updated_date=?
     WHERE id=? AND user_id=?`
  ).bind(title, bBody, due_date, completed, noteId, recurrence, recurrenceEndDate, recurrenceCount, reminder.notified, ts, params.id, user.id).run()

  // Auto-create next occurrence for recurring reminders
  let nextReminder = null
  if (justCompleted && recurrence) {
    const nextDate = nextDueDate(due_date, recurrence)
    if (nextDate) {
      const nextId = gid()
      await env.DB.prepare(
        `INSERT INTO note_reminders (id, user_id, note_id, title, body, due_date, completed, notified, recurrence, created_date, updated_date)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
      ).bind(nextId, user.id, noteId, title, bBody, nextDate, recurrence, ts, ts).run()
      nextReminder = { id: nextId, user_id: user.id, note_id: noteId, title, body: bBody, due_date: nextDate, completed: 0, notified: 0, recurrence, created_date: ts, updated_date: ts }
    }
  }

  return json({ id: params.id, title, body: bBody, due_date, completed, note_id: noteId, recurrence, recurrence_end_date: recurrenceEndDate, recurrence_count: recurrenceCount, updated_date: ts, next: nextReminder })
}

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()
  const r = await env.DB.prepare(
    'SELECT id FROM note_reminders WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first()
  if (!r) return notFound()
  await env.DB.prepare('DELETE FROM note_reminders WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id).run()
  return json({ ok: true })
}