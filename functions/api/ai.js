// POST /api/ai — proxy para Anthropic (usa ANTHROPIC_API_KEY da env)
// Suporta visão: analisa imagem de nota manuscrita/impressa e propõe conteúdo + tema
import { getAuthUser, unauthorized, json } from '../_auth.js'

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()

  const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' }, 500)
  }

  let body
  try { body = await request.json() } catch { return json({ error: 'JSON inválido' }, 400) }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return json(data, response.status)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}