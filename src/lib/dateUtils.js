// dateUtils.js — helpers de datas para a grelha mensal e formulários

export const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const DAY_NAMES = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

export function pad(n) { return String(n).padStart(2, '0') }

export function dateKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export function todayKey() {
  const d = new Date()
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate() }

// 0 = Monday
export function firstWeekday(year, month) { return (new Date(year, month, 1).getDay() + 6) % 7 }

/**
 * Build the full grid of date keys for a month view, including leading/trailing
 * days from adjacent months so every row has 7 days.
 */
export function buildMonthGrid(year, month) {
  const first = firstWeekday(year, month)
  const total = daysInMonth(year, month)
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevTotal = daysInMonth(prevYear, prevMonth)
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const cells = []
  for (let i = 0; i < first; i++) {
    cells.push({ day: prevTotal - first + 1 + i, month: prevMonth, year: prevYear, inMonth: false })
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, month, year, inMonth: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ day: nextDay++, month: nextMonth, year: nextYear, inMonth: false })
  }
  return cells.map(c => ({ ...c, key: dateKey(c.year, c.month, c.day) }))
}

export function isoToDate(iso) { return iso ? iso.slice(0, 10) : '' }
export function isoToTime(iso) {
  if (!iso || !iso.includes('T')) return ''
  const t = iso.slice(11, 16)
  return t === '00:00' ? '' : t
}
export function combineDatetime(date, time) {
  if (!date) return ''
  return date + 'T' + (time || '00:00')
}

export function fmtDayRange(startIso, endIso, allDay) {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const opts = { day: '2-digit', month: 'short' }
  if (allDay) {
    const sKey = isoToDate(startIso), eKey = isoToDate(endIso)
    if (sKey === eKey) return s.toLocaleDateString('pt-PT', opts)
    return `${s.toLocaleDateString('pt-PT', opts)} — ${e.toLocaleDateString('pt-PT', opts)}`
  }
  return `${s.toLocaleDateString('pt-PT', opts)} ${isoToTime(startIso)} — ${isoToTime(endIso) || isoToTime(startIso)}`
}
