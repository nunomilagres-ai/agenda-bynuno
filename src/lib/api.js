// src/lib/api.js — API client helpers
const J = { 'Content-Type': 'application/json' }

// Ocorrências de eventos recorrentes usam um id sintético "<id>::<data>" — as
// chamadas à API operam sempre sobre o evento real (a série inteira).
function realId(id) { return String(id).split('::')[0] }

async function handle(res) {
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`)
  return data
}

export const api = {
  locations: {
    list:   ()      => fetch('/api/locations').then(handle),
    create: (d)     => fetch('/api/locations', { method: 'POST', headers: J, body: JSON.stringify(d) }).then(handle),
    update: (id, d) => fetch(`/api/locations/${id}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    delete: (id)    => fetch(`/api/locations/${id}`, { method: 'DELETE' }).then(handle),
  },
  locationPeriods: {
    list:   (start, end) => fetch(`/api/location-periods?start=${start}&end=${end}`).then(handle),
    create: (d)           => fetch('/api/location-periods', { method: 'POST', headers: J, body: JSON.stringify(d) }).then(handle),
    update: (id, d)        => fetch(`/api/location-periods/${id}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    delete: (id)           => fetch(`/api/location-periods/${id}`, { method: 'DELETE' }).then(handle),
  },
  events: {
    list:   (start, end) => fetch(`/api/events?start=${start}&end=${end}`).then(handle),
    get:    (id)          => fetch(`/api/events/${realId(id)}`).then(handle),
    create: (d)           => fetch('/api/events', { method: 'POST', headers: J, body: JSON.stringify(d) }).then(handle),
    update: (id, d)        => fetch(`/api/events/${realId(id)}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    delete: (id)           => fetch(`/api/events/${realId(id)}`, { method: 'DELETE' }).then(handle),
    // Uma única ocorrência de uma série (nunca para aniversários) — masterId sem sufixo, date = occurrence_date.
    updateOccurrence: (masterId, date, d) => fetch(`/api/events/${masterId}/occurrence/${date}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    deleteOccurrence: (masterId, date)    => fetch(`/api/events/${masterId}/occurrence/${date}`, { method: 'DELETE' }).then(handle),
  },
}

export function gid() {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
}
