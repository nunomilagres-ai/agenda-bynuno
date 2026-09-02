// aiPhoto.js — analyse a photo with Claude Vision and return note proposal
export async function analyzeNotePhoto(base64, mediaType, topics) {
  const topicList = topics.length
    ? 'Temas disponíveis: ' + topics.map(t => t.emoji + ' ' + t.name).join(', ')
    : 'Ainda sem temas definidos.'

  const payload = {
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: 'Analisa esta imagem de uma nota (manuscrita, impressa ou fotografada).\n\n' + topicList + '\n\nResponde APENAS com JSON:\n{"title":"...","content":"... Markdown ...","topic_name":"... ou null","confidence":0.9}\n\nNada fora do JSON.' },
      ],
    }],
  }

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Erro na API de IA (' + res.status + ')')
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  const text = data.content?.[0]?.text || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta IA inválida')
  return JSON.parse(match[0])
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ base64: reader.result.split(',')[1], mediaType: file.type })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}