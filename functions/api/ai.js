// POST /api/ai — analisa uma foto de nota (manuscrita/impressa) via Cloudflare
// Workers AI, no binding AI da própria conta Cloudflare — grátis, sem chave a
// configurar (ao contrário da versão anterior, que usava a API paga da
// Anthropic). Recebe { base64, mediaType, prompt } e devolve { text }.
import { getAuthUser, unauthorized, json } from '../_auth.js'

const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'

export async function onRequestPost({ request, env }) {
  const user = await getAuthUser(request, env)
  if (!user) return unauthorized()

  let body
  try { body = await request.json() } catch { return json({ error: 'JSON inválido' }, 400) }

  const { base64, mediaType, prompt } = body
  if (!base64 || !prompt) return json({ error: 'base64 e prompt são obrigatórios' }, 400)

  // Este modelo quer os bytes da imagem como array de inteiros, não a string base64.
  let imageBytes
  try {
    imageBytes = Array.from(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
  } catch {
    return json({ error: 'base64 inválido' }, 400)
  }

  try {
    const result = await env.AI.run(MODEL, {
      image: imageBytes,
      prompt,
      max_tokens: 1024,
    })
    // A documentação da Cloudflare para este modelo já teve exemplos que não
    // funcionavam (github.com/cloudflare/cloudflare-docs/issues/19185) — por
    // segurança aceitam-se as formas de resposta conhecidas dos modelos de
    // texto/visão da Workers AI, em vez de assumir só uma.
    const text = result?.response ?? result?.result?.response ?? result?.description ?? ''
    if (!text) return json({ error: 'Resposta vazia do modelo', raw: result }, 502)
    return json({ text })
  } catch (e) {
    return json({ error: e.message || 'Erro na Workers AI' }, 500)
  }
}
