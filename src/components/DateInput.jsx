// DateInput.jsx — campo de data que mostra sempre dd/mm/aaaa, nos dois campos
// e no calendário, independentemente da localização do sistema operativo do
// utilizador. Ver a regra "Datas: sempre dd/mm/aaaa" no CLAUDE.md partilhado.
//
// Um <input type="date"> nativo não serve sozinho para isto: o valor
// devolvido é sempre ISO (yyyy-mm-dd), mas o TEXTO mostrado ao utilizador
// segue a localização do sistema operativo/browser — no Chrome/Firefox isso
// não é controlável pelo atributo lang da página, só pela configuração da
// máquina. Por isso este componente escreve o texto sozinho (dd/mm/aaaa,
// com "/" inseridos automaticamente) e usa um <input type="date"> escondido
// só para abrir o popup do calendário nativo quando o utilizador prefere
// escolher em vez de escrever.
import { useState, useEffect, useRef } from 'react'
import { Calendar } from 'lucide-react'

function isoToDisplay(iso) {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function digitsToDisplay(digits) {
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
  return digits
}

function isValidDate(day, month, year) {
  if (year < 1900 || year > 2200) return false
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(year, month, 0).getDate()
  return day >= 1 && day <= daysInMonth
}

export default function DateInput({ value, onChange, required, placeholder, className, style, title }) {
  const [text, setText] = useState(isoToDisplay(value))
  const hiddenRef = useRef(null)

  // O valor pode mudar por fora (ex: escolhido no popup nativo, ou reset do
  // formulário) — sincroniza o texto mostrado sempre que isso acontecer.
  useEffect(() => { setText(isoToDisplay(value)) }, [value])

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    setText(digitsToDisplay(digits))
    if (digits.length === 0) { onChange(''); return }
    if (digits.length < 8) return // ainda a escrever — só actualiza para cima quando a data estiver completa
    const day = parseInt(digits.slice(0, 2), 10)
    const month = parseInt(digits.slice(2, 4), 10)
    const year = parseInt(digits.slice(4, 8), 10)
    if (isValidDate(day, month, year)) {
      onChange(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    }
  }

  function handleBlur() {
    // Se ficou incompleta/inválida ao sair do campo, não deixa lixo visível —
    // volta a mostrar o que estava realmente guardado.
    setText(isoToDisplay(value))
  }

  return (
    <div className={`relative flex items-center ${className || ''}`} style={style}>
      <input type="text" inputMode="numeric" autoComplete="off" placeholder={placeholder || 'dd/mm/aaaa'}
        value={text} onChange={handleChange} onBlur={handleBlur} required={required} title={title}
        maxLength={10} className="w-full bg-transparent focus:outline-none" />
      <button type="button" tabIndex={-1} onClick={() => hiddenRef.current?.showPicker?.()}
        className="flex-shrink-0 ml-1 opacity-60 hover:opacity-100" title="Escolher no calendário">
        <Calendar size={13} />
      </button>
      <input ref={hiddenRef} type="date" value={value || ''} onChange={e => onChange(e.target.value)}
        tabIndex={-1} aria-hidden="true"
        className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none" />
    </div>
  )
}
