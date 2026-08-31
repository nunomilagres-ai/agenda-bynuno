// CalendarPage.jsx — vista mensal, em scroll vertical contínuo (não paginado por mês)
import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, MapPin, LogOut, CalendarPlus, Printer, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { MONTH_NAMES, buildMonthGrid, todayKey } from '@/lib/dateUtils'
import MonthGrid from '@/components/MonthGrid'
import EventModal from '@/components/EventModal'
import LocationSidebar from '@/components/LocationSidebar'
import LocationPeriodModal from '@/components/LocationPeriodModal'

const MONTHS_BEFORE = 6
const MONTHS_AFTER = 6
const LOAD_MORE_STEP = 6

function monthKey(y, m) { return `${y}-${String(m + 1).padStart(2, '0')}` }
function shiftYM(y, m, delta) {
  const d = new Date(y, m + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}
function defaultWindow(today) {
  const win = []
  for (let i = -MONTHS_BEFORE; i <= MONTHS_AFTER; i++) {
    win.push(shiftYM(today.getFullYear(), today.getMonth(), i))
  }
  return win
}

export default function CalendarPage() {
  const { user, logout } = useAuth()
  const today = useMemo(() => new Date(), [])
  const tKey = todayKey()
  const todayMKey = monthKey(today.getFullYear(), today.getMonth())

  const [monthsWindow, setMonthsWindow] = useState(() => defaultWindow(today))
  const [activeMonthKey, setActiveMonthKey] = useState(todayMKey)

  const [locations, setLocations] = useState([])
  const [periods, setPeriods] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [showLocations, setShowLocations] = useState(false)
  const [eventModal, setEventModal] = useState(null)   // { date } | { event }
  const [periodModal, setPeriodModal] = useState(null) // { location } | { range } | { period }

  const scrollRef = useRef(null)
  const sectionRefs = useRef(new Map())
  const prependHeightRef = useRef(null)
  const scrollToTodayRef = useRef(true) // salta para hoje assim que as secções montarem

  // cells por mês da janela carregada
  const monthsCells = useMemo(
    () => monthsWindow.map(({ year, month }) => ({ year, month, key: monthKey(year, month), cells: buildMonthGrid(year, month) })),
    [monthsWindow]
  )
  const rangeStart = monthsCells[0].cells[0].key
  const rangeEnd = monthsCells[monthsCells.length - 1].cells.at(-1).key

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [locs, pers, evs] = await Promise.all([
        api.locations.list(),
        api.locationPeriods.list(rangeStart, rangeEnd),
        api.events.list(rangeStart, rangeEnd),
      ])
      setLocations(locs)
      setPeriods(pers)
      setEvents(evs)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [rangeStart, rangeEnd])

  useEffect(() => { loadData() }, [loadData])

  function loadEarlier() {
    prependHeightRef.current = scrollRef.current?.scrollHeight ?? null
    setMonthsWindow(w => {
      const extra = []
      for (let i = LOAD_MORE_STEP; i >= 1; i--) extra.push(shiftYM(w[0].year, w[0].month, -i))
      return [...extra, ...w]
    })
  }
  function loadLater() {
    setMonthsWindow(w => {
      const last = w[w.length - 1]
      const extra = []
      for (let i = 1; i <= LOAD_MORE_STEP; i++) extra.push(shiftYM(last.year, last.month, i))
      return [...w, ...extra]
    })
  }

  useLayoutEffect(() => {
    if (prependHeightRef.current != null && scrollRef.current) {
      const added = scrollRef.current.scrollHeight - prependHeightRef.current
      scrollRef.current.scrollTop += added
      prependHeightRef.current = null
    }
  }, [monthsWindow])

  useEffect(() => {
    if (scrollToTodayRef.current) {
      scrollToTodayRef.current = false
      sectionRefs.current.get(todayMKey)?.scrollIntoView({ block: 'start' })
    }
  }, [monthsWindow, todayMKey])

  function goToday() {
    if (sectionRefs.current.has(todayMKey)) {
      sectionRefs.current.get(todayMKey).scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      scrollToTodayRef.current = true
      setMonthsWindow(defaultWindow(today))
    }
  }

  // Observa qual mês está visível no topo do scroll — usado só para saber o
  // que imprimir (a impressão mostra apenas o mês atualmente visível).
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length === 0) return
      visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      setActiveMonthKey(visible[0].target.dataset.monthKey)
    }, { root, threshold: [0, 0.1, 0.5, 1] })
    for (const el of sectionRefs.current.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [monthsWindow])

  // dateKey -> period (primeira localização que cobre o dia)
  const periodByDay = useMemo(() => {
    const map = {}
    for (const { cells } of monthsCells) {
      for (const cell of cells) {
        for (const p of periods) {
          if (p.start_date <= cell.key && cell.key <= p.end_date) { map[cell.key] = p; break }
        }
      }
    }
    return map
  }, [monthsCells, periods])

  // dateKey -> eventos que ocorrem nesse dia (expande eventos multi-dia)
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const ev of events) {
      const s = ev.start_datetime.slice(0, 10)
      const e = ev.end_datetime.slice(0, 10)
      for (const { cells } of monthsCells) {
        for (const cell of cells) {
          if (s <= cell.key && cell.key <= e) {
            if (!map[cell.key]) map[cell.key] = []
            map[cell.key].push(ev)
          }
        }
      }
    }
    return map
  }, [monthsCells, events])

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🗓️</span>
          <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>Agenda</h1>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={() => setShowLocations(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-2)' }}>
            <MapPin size={14} /> Localizações
          </button>
          <button onClick={() => setEventModal({ date: tKey })}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: 'var(--accent-solid)' }}>
            <Plus size={14} /> Evento
          </button>
          <button onClick={() => window.print()} title="Imprimir" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
            <Printer size={15} style={{ color: 'var(--text-3)' }} />
          </button>
          {user && (
            <button onClick={logout} title="Sair" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
              <LogOut size={15} style={{ color: 'var(--text-3)' }} />
            </button>
          )}
        </div>
      </header>

      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
        <button onClick={goToday} className="no-print text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
          Hoje
        </button>

        {locations.length > 0 && (
          <div className="hidden sm:flex items-center gap-3">
            {locations.map(l => (
              <span key={l.id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-5 min-h-0" style={{ opacity: loading ? 0.6 : 1 }}>
        <button onMouseDown={e => e.preventDefault()} onClick={loadEarlier} className="no-print w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] mb-2"
          style={{ color: 'var(--text-3)' }}>
          <ChevronUp size={14} /> Meses anteriores
        </button>

        {monthsCells.map(({ year, month, key, cells }) => (
          <div key={key} data-month-key={key}
            ref={el => { if (el) sectionRefs.current.set(key, el); else sectionRefs.current.delete(key) }}
            className={key === activeMonthKey ? 'mb-6' : 'mb-6 no-print'}>
            <h2 className="sticky top-0 z-10 text-sm font-semibold py-2" style={{ color: 'var(--text)', background: 'var(--bg)' }}>
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <MonthGrid
                cells={cells}
                periodByDay={periodByDay}
                eventsByDay={eventsByDay}
                todayKey={tKey}
                onDayClick={(dateKey) => setEventModal({ date: dateKey })}
                onEventClick={(event) => setEventModal({ event })}
                onPeriodClick={(period) => setPeriodModal({ period })}
                onRangeSelect={(start, end) => {
                  if (locations.length === 0) { toast.error('Cria uma localização primeiro em "Localizações"'); return }
                  setPeriodModal({ range: { start, end } })
                }}
              />
            </div>
          </div>
        ))}

        <button onMouseDown={e => e.preventDefault()} onClick={loadLater} className="no-print w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--text-3)' }}>
          Meses seguintes <ChevronDown size={14} />
        </button>
      </main>

      {eventModal && (
        <EventModal
          date={eventModal.date}
          event={eventModal.event}
          locations={locations}
          onClose={() => setEventModal(null)}
          onSaved={loadData}
          onDeleted={loadData}
        />
      )}

      {showLocations && (
        <LocationSidebar
          locations={locations}
          onClose={() => setShowLocations(false)}
          onChanged={loadData}
          onMarkPeriod={(loc) => { setPeriodModal({ location: loc }); }}
        />
      )}

      {periodModal && (
        <LocationPeriodModal
          locations={locations}
          defaultLocationId={periodModal.location?.id}
          defaultDate={tKey}
          defaultStartDate={periodModal.range?.start}
          defaultEndDate={periodModal.range?.end}
          period={periodModal.period}
          onClose={() => setPeriodModal(null)}
          onSaved={loadData}
          onDeleted={loadData}
        />
      )}

      {locations.length === 0 && !loading && (
        <div className="fixed bottom-5 right-5 max-w-xs p-3 rounded-xl animate-fade-in flex items-start gap-2 no-print"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 14px var(--shadow)' }}>
          <CalendarPlus size={16} style={{ color: 'var(--accent)', marginTop: 2 }} />
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            Cria localizações (Porto, Lisboa, Vila Real...) em <strong>Localizações</strong> para tingir os dias do calendário.
          </p>
        </div>
      )}
    </div>
  )
}
