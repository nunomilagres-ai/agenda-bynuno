// CalendarPage.jsx — vista mensal principal
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, MapPin, LogOut, CalendarPlus, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { MONTH_NAMES, buildMonthGrid, todayKey } from '@/lib/dateUtils'
import MonthGrid from '@/components/MonthGrid'
import EventModal from '@/components/EventModal'
import LocationSidebar from '@/components/LocationSidebar'
import LocationPeriodModal from '@/components/LocationPeriodModal'

export default function CalendarPage() {
  const { user, logout } = useAuth()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const [locations, setLocations] = useState([])
  const [periods, setPeriods] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [showLocations, setShowLocations] = useState(false)
  const [eventModal, setEventModal] = useState(null)   // { date } | { event }
  const [periodModal, setPeriodModal] = useState(null) // { location } | null

  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])
  const rangeStart = cells[0].key
  const rangeEnd = cells[cells.length - 1].key
  const tKey = todayKey()

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

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()) }

  // dateKey -> period (primeira localização que cobre o dia)
  const periodByDay = useMemo(() => {
    const map = {}
    for (const cell of cells) {
      for (const p of periods) {
        if (p.start_date <= cell.key && cell.key <= p.end_date) { map[cell.key] = p; break }
      }
    }
    return map
  }, [cells, periods])

  // dateKey -> eventos que ocorrem nesse dia (expande eventos multi-dia)
  const eventsByDay = useMemo(() => {
    const map = {}
    for (const ev of events) {
      const s = ev.start_datetime.slice(0, 10)
      const e = ev.end_datetime.slice(0, 10)
      for (const cell of cells) {
        if (s <= cell.key && cell.key <= e) {
          if (!map[cell.key]) map[cell.key] = []
          map[cell.key].push(ev)
        }
      }
    }
    return map
  }, [cells, events])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
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
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] no-print">
            <ChevronLeft size={16} style={{ color: 'var(--text-2)' }} />
          </button>
          <span className="text-sm font-semibold w-36 text-center" style={{ color: 'var(--text)' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] no-print">
            <ChevronRight size={16} style={{ color: 'var(--text-2)' }} />
          </button>
          <button onClick={goToday}
            className="text-xs font-medium px-2.5 py-1 rounded-lg ml-1 hover:bg-[var(--surface-2)] no-print"
            style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
            Hoje
          </button>
        </div>

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

      <main className="flex-1 flex flex-col px-5 pb-5 min-h-0">
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden min-h-0"
          style={{ border: '1px solid var(--border)', opacity: loading ? 0.6 : 1 }}>
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
