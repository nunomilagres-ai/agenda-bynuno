import { useState } from 'react'
import { Check, X } from 'lucide-react'

const EMOJIS = [
  // Geral
  '📋','📝','💡','📚','🎯','💼','🗒️','📌','🔖','⭐',
  // Saúde & Bem-estar
  '🏋️','💊','🩺','🩻','🧘','🥗','🏃','💉','🩹','❤️',
  // Finanças
  '💰','💳','📈','📉','🏦','💵','🧾','💹','🏧','💸',
  // Férias & Viagens
  '✈️','🏖️','🏔️','🗺️','🧳','🚢','🏕️','🌍','🌴','🎡',
  // Entretenimento
  '🎬','🎮','🎵','🎭','📺','🎸','🎲','🎤','🎨','🧩',
  // Casa & Compras
  '🏠','🛒','🍕','🧹','🔧','🛋️','🌱','🐾','👕','🎁',
]

const COLORS = ['#E8A838','#D4822E','#3B82F6','#10B981','#8B5CF6','#EF4444','#F59E0B','#06B6D4']

export default function TopicForm({ v, onSave, onCancel }) {
  const [name, setName] = useState(v?.name ?? '')
  const [emoji, setEmoji] = useState(v?.emoji ?? '📋')
  const [color, setColor] = useState(v?.color ?? 'var(--accent)')
  return (
    <form onSubmit={e => { e.preventDefault(); name.trim() && onSave({ name: name.trim(), emoji, color }) }}
      className="p-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nome do tema…"
        className="w-full text-xs bg-transparent focus:outline-none mb-1.5" style={{ color: 'var(--text)' }} />
      <div className="flex flex-wrap gap-1 mb-1.5">
        {EMOJIS.map(e => (
          <button key={e} type="button" onClick={() => setEmoji(e)}
            className="w-6 h-6 rounded text-sm flex items-center justify-center"
            style={{ background: emoji === e ? 'var(--surface)6E8' : 'transparent', outline: emoji === e ? '1.5px solid var(--accent)' : 'none' }}>
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)}
            className="w-4 h-4 rounded-full border-2"
            style={{ background: c, borderColor: color === c ? 'var(--text)' : 'transparent' }} />
        ))}
      </div>
      <div className="flex gap-1.5">
        <button type="submit" className="flex-1 py-1 rounded text-xs font-medium text-white flex items-center justify-center gap-1" style={{ background: 'var(--accent)' }}>
          <Check size={10} /> Guardar
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1 rounded text-xs" style={{ background: 'var(--border)', color: 'var(--text-2)' }}>
          <X size={10} />
        </button>
      </div>
    </form>
  )
}