// src/lib/NotificationService.js
// Polls pending reminders every 60s and fires Web Notifications

let intervalId = null

async function requestPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

async function checkReminders() {
  try {
    const res = await fetch('/api/note-reminders?completed=0')
    if (!res.ok) return
    const list = await res.json()
    const now = Date.now()
    for (const r of list) {
      if (r.notified) continue
      const due = new Date(r.due_date).getTime()
      if (due <= now) {
        new Notification('🔔 ' + r.title, {
          body: r.body || 'Lembrete vencido',
          icon: '/favicon.svg',
          tag: 'reminder-' + r.id,
        })
        // Mark as notified
        await fetch('/api/note-reminders/' + r.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...r, notified: 1 }),
        })
      }
    }
  } catch { /* silently ignore network errors */ }
}

export async function startNotificationService() {
  const allowed = await requestPermission()
  if (!allowed) return
  await checkReminders()
  if (intervalId) clearInterval(intervalId)
  intervalId = setInterval(checkReminders, 60_000)
}

export function stopNotificationService() {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
}