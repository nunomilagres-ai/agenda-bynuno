// functions/_recurrence.js — expande um evento recorrente nas suas ocorrências
// dentro de um intervalo [rangeStart, rangeEnd], sem tocar na base de dados.
//
// Cada ocorrência (incluindo a primeira) pode ter uma exceção associada
// (event_exceptions) que substitui os seus campos ou a remove — exceto para
// event_type = 'birthday', que nunca tem exceções (edição/eliminação afeta
// sempre a série inteira, tratada fora desta função).
//
// A ocorrência n=0 mantém sempre o id real do evento; as seguintes usam um id
// sintético "<id>::<occurrence_date>". occurrence_date é sempre a data
// calculada pelo padrão (nunca a data alterada por uma exceção) — é a chave
// usada para procurar/gravar exceções.

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
 * `exceptionsByDate` é um mapa occurrence_date -> linha de event_exceptions (ou undefined).
 * Devolve sempre um array (1 elemento se não for recorrente).
 */
export function expandEvent(event, exceptionsByDate, rangeStart, rangeEnd) {
  if (!event.recurrence_freq || !STEP_BY_N[event.recurrence_freq]) return [event];

  const until = event.recurrence_until || null;
  const exByDate = exceptionsByDate || {};
  const out = [];

  for (let n = 0; n < MAX_OCCURRENCES; n++) {
    const patternStart = shiftByN(event.start_datetime, event.recurrence_freq, n);
    const patternEnd = shiftByN(event.end_datetime, event.recurrence_freq, n);
    const occurrenceDate = patternStart.slice(0, 10);

    if (occurrenceDate > rangeEnd) break;
    if (until && occurrenceDate > until) break;

    const ex = exByDate[occurrenceDate];
    if (ex?.deleted) continue;

    const startDatetime = ex?.start_datetime ?? patternStart;
    const endDatetime = ex?.end_datetime ?? patternEnd;
    const startDate = startDatetime.slice(0, 10);
    const endDate = endDatetime.slice(0, 10);

    if (endDate >= rangeStart && startDate <= rangeEnd) {
      out.push({
        ...event,
        id: n === 0 ? event.id : `${event.id}::${occurrenceDate}`,
        occurrence_date: occurrenceDate,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        title: ex?.title ?? event.title,
        description: ex ? ex.description : event.description,
        all_day: ex?.all_day ?? event.all_day,
        location_id: ex ? ex.location_id : event.location_id,
        location_name: ex ? ex.location_name : event.location_name,
        location_color: ex ? ex.location_color : event.location_color,
      });
    }
  }
  return out;
}

/** Extrai o id real (da BD) a partir de um id de ocorrência "<id>::<data>". */
export function realEventId(id) {
  return String(id).split('::')[0];
}
