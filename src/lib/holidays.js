// holidays.js — feriados nacionais portugueses + municipais de Lisboa e Vila Real
import { dateKey } from './dateUtils'

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, válido para o calendário gregoriano)
function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 1 = março, mas aqui já dá 3/4 diretamente
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function keyFromDate(d) {
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Feriados nacionais obrigatórios (13), incluindo os móveis calculados a partir da Páscoa. */
export function nationalHolidays(year) {
  const easter = easterSunday(year)
  return [
    { date: dateKey(year, 0, 1), name: 'Ano Novo' },
    { date: keyFromDate(addDays(easter, -2)), name: 'Sexta-feira Santa' },
    { date: keyFromDate(easter), name: 'Páscoa' },
    { date: dateKey(year, 3, 25), name: 'Dia da Liberdade' },
    { date: dateKey(year, 4, 1), name: 'Dia do Trabalhador' },
    { date: keyFromDate(addDays(easter, 60)), name: 'Corpo de Deus' },
    { date: dateKey(year, 5, 10), name: 'Dia de Portugal' },
    { date: dateKey(year, 7, 15), name: 'Assunção de Nossa Senhora' },
    { date: dateKey(year, 9, 5), name: 'Implantação da República' },
    { date: dateKey(year, 10, 1), name: 'Todos os Santos' },
    { date: dateKey(year, 11, 1), name: 'Restauração da Independência' },
    { date: dateKey(year, 11, 8), name: 'Imaculada Conceição' },
    { date: dateKey(year, 11, 25), name: 'Natal' },
  ]
}

/** Feriados municipais — só Lisboa e Vila Real, os locais relevantes para esta agenda. */
export function municipalHolidays(year) {
  return [
    { date: dateKey(year, 5, 13), name: 'Santo António — feriado municipal (Lisboa e Vila Real)' },
  ]
}

let cache = new Map()

/** Devolve { name, municipal } para o dateKey indicado, ou null se não for feriado. */
export function getHoliday(key) {
  const year = Number(key.slice(0, 4))
  if (!cache.has(year)) {
    const map = new Map()
    for (const h of nationalHolidays(year)) map.set(h.date, { name: h.name, municipal: false })
    for (const h of municipalHolidays(year)) if (!map.has(h.date)) map.set(h.date, { name: h.name, municipal: true })
    cache.set(year, map)
  }
  return cache.get(year).get(key) || null
}
