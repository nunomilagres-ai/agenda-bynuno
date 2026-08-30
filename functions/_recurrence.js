// functions/_recurrence.js — expande um evento recorrente nas suas ocorrências
// dentro de um intervalo [rangeStart, rangeEnd], sem tocar na base de dados.
// Cada ocorrência (exceto a primeira) recebe um id sintético "<id>::<data>".

const MAX_OCCURRENCES = 3000;

function splitDatetime(dt) {
  const t = dt.indexOf('T');
  return t === -1 ? { date: dt, time: '' } : { date: dt.slice(0, t), time: dt.slice(t) };
}

function addDaysToKey(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function addMonthsToKey(key, months) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

const STEP_BY_N = {
  weekly:        (key, n) => addDaysToKey(key, 7 * n),
  biweekly:      (key, n) => addDaysToKey(key, 14 * n),
  every_3_weeks: (key, n) => addDaysToKey(key, 21 * n),
  monthly:       (key, n) => addMonthsToKey(key, n),
  yearly:        (key, n) => addMonthsToKey(key, 12 * n),
};

export const RECURRENCE_FREQS = Object.keys(STEP_BY_N);

function shiftByN(dt, freq, n) {
  const { date, time } = splitDatetime(dt);
  return STEP_BY_N[freq](date, n) + time;
}

/**
 * Expande um evento (linha da BD) nas ocorrências que sobrepõem [rangeStart, rangeEnd].
 * Devolve sempre um array (1 elemento se não for recorrente).
 */
export function expandEvent(event, rangeStart, rangeEnd) {
  if (!event.recurrence_freq || !STEP_BY_N[event.recurrence_freq]) return [event];

  const until = event.recurrence_until || null;
  const out = [];

  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const occStart = shiftByN(event.start_datetime, event.recurrence_freq, n);
    const occEnd = shiftByN(event.end_datetime, event.recurrence_freq, n);
    const occStartDate = occStart.slice(0, 10);
    const occEndDate = occEnd.slice(0, 10);

    if (occStartDate > rangeEnd) break;
    if (until && occStartDate > until) break;

    if (occEndDate >= rangeStart && occStartDate <= rangeEnd) {
      out.push({
        ...event,
        id: n === 0 ? event.id : `${event.id}::${occStartDate}`,
        start_datetime: occStart,
        end_datetime: occEnd,
        recurrence_master_id: event.id,
      });
    }
  }
  return out;
}

/** Extrai o id real (da BD) a partir de um id de ocorrência "<id>::<data>". */
export function realEventId(id) {
  return String(id).split('::')[0];
}
