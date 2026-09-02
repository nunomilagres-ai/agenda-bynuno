// aiPhoto.js — analisa uma foto de nota via Cloudflare Workers AI (grátis,
// sem chave a configurar) e devolve uma proposta de {title, content, topic_name}.
export async function analyzeNotePhoto(base64, mediaType, topics) {
  const topicList = topics.length
    ? 'Temas disponíveis: ' + topics.map(t => t.emoji + ' ' + t.name).join(', ')
    : 'Ainda sem temas definidos.'

  const prompt =
    'Analisa esta imagem de uma nota (manuscrita, impressa ou fotografada).\n\n' +
    topicList +
    '\n\nResponde APENAS com JSON, nada fora dele:\n' +
    '{"title":"...","content":"... Markdown ...","topic_name":"... ou null","confidence":0.9}'

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType, prompt }),
  })
  if (!res.ok) throw new Error('Erro na análise da foto (' + res.status + ')')
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  const match = (data.text || '').match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta da IA inválida')
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
