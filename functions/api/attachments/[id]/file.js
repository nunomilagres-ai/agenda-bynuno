// GET /api/attachments/:id/file — servir os bytes do anexo (autenticado)
//
// Os buckets R2 não são públicos por omissão e configurar um domínio próprio
// para o bucket é um passo manual fora do alcance deste ambiente — em vez
// disso os bytes passam sempre por esta rota, que confirma que o anexo
// pertence ao utilizador antes de os servir. "inline" (não "attachment") no
// Content-Disposition deixa PDFs/fotos abrirem numa nova aba em vez de
// forçarem sempre uma descarga.
import { getAuthUser, unauthorized, notFound } from '../../../_auth.js';

export async function onRequestGet({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const att = await env.DB.prepare(
    'SELECT filename, content_type, r2_key FROM note_attachments WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!att) return notFound('Anexo não encontrado');

  const object = await env.ATTACHMENTS.get(att.r2_key);
  if (!object) return notFound('Ficheiro não encontrado no armazenamento');

  const headers = new Headers();
  headers.set('Content-Type', att.content_type || 'application/octet-stream');
  headers.set('Content-Disposition', `inline; filename="${(att.filename || 'anexo').replace(/"/g, "'")}"`);
  headers.set('Cache-Control', 'private, max-age=3600');

  return new Response(object.body, { headers });
}
