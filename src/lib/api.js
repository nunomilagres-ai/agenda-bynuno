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

  // ─── Notas (vindas do notes.bynuno.com) ───────────────────────────────────
  // Passam pelo mesmo handle() dos eventos: no Notes cada chamada fazia
  // .then(r => r.json()) sem verificar o estado, o que transformava um 401 ou
  // um 500 num objeto {error} que seguia para o ecrã como se fossem dados.
  topics: {
    list:   ()      => fetch('/api/note-topics').then(handle),
    create: (d)     => fetch('/api/note-topics', { method: 'POST', headers: J, body: JSON.stringify(d) }).then(handle),
    update: (id, d) => fetch(`/api/note-topics/${id}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    delete: (id)    => fetch(`/api/note-topics/${id}`, { method: 'DELETE' }).then(handle),
  },
  notes: {
    list:   (tid)   => fetch(`/api/notes${tid !== undefined ? `?topic_id=${encodeURIComponent(tid)}` : ''}`).then(handle),
    get:    (id)    => fetch(`/api/notes/${id}`).then(handle),
    create: (d)     => fetch('/api/notes', { method: 'POST', headers: J, body: JSON.stringify(d) }).then(handle),
    update: (id, d) => fetch(`/api/notes/${id}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    delete: (id)    => fetch(`/api/notes/${id}`, { method: 'DELETE' }).then(handle),
  },
  reminders: {
    list:   ()      => fetch('/api/note-reminders').then(handle),
    create: (d)     => fetch('/api/note-reminders', { method: 'POST', headers: J, body: JSON.stringify(d) }).then(handle),
    update: (id, d) => fetch(`/api/note-reminders/${id}`, { method: 'PUT', headers: J, body: JSON.stringify(d) }).then(handle),
    delete: (id)    => fetch(`/api/note-reminders/${id}`, { method: 'DELETE' }).then(handle),
  },
  attachments: {
    list:   (noteId)       => fetch(`/api/notes/${noteId}/attachments`).then(handle),
    // Sem header Content-Type manual — o browser define-o sozinho (com o boundary certo) para FormData.
    upload: (noteId, file) => {
      const fd = new FormData()
      fd.append('file', file)
      return fetch(`/api/notes/${noteId}/attachments`, { method: 'POST', body: fd }).then(handle)
    },
    delete: (id)            => fetch(`/api/attachments/${id}`, { method: 'DELETE' }).then(handle),
    fileUrl: (id)           => `/api/attachments/${id}/file`,
  },
}

export function gid() {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('')
}

// ─── Formatação de datas das notas/lembretes ─────────────────────────────────

/** Data de alteração de uma nota, em relativo ("ontem", "qua", "14 mar"). */
export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return d.toLocaleDateString('pt-PT', { weekday: 'short' })
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

/** Prazo de um lembrete + se já passou, para o pintar de vermelho. */
export function fmtDue(iso) {
  if (!iso) return { label: '', overdue: false }
  const d = new Date(iso)
  const diff = d - Date.now()
  const overdue = diff < 0
  let label
  if (overdue) {
    label = d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } else if (diff < 3600000) {
    label = 'em ' + Math.round(diff / 60000) + ' min'
  } else if (diff < 86400000) {
    label = 'hoje ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 172800000) {
    label = 'amanha ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  } else {
    label = d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return { label, overdue }
}

/**
 * Markdown mínimo para a pré-visualização de uma nota. Escapa &, < e > antes
 * de qualquer outra coisa — o resultado vai para dentro de dangerouslySetInnerHTML.
 */
export function renderMarkdown(text) {
  if (!text) return ''
  const s = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="md-pre"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/^#{6} (.+)$/gm, '<h6 class="md-h6">$1</h6>')
    .replace(/^#{5} (.+)$/gm, '<h5 class="md-h5">$1</h5>')
    .replace(/^#{4} (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^#{3} (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^#{1} (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="md-ul">$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^---$/gm, '<hr class="md-hr" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-a">$1</a>')
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br />')
  return '<p class="md-p">' + s + '</p>'
}
