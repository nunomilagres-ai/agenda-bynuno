// DELETE /api/attachments/:id — apagar um anexo (linha + objeto R2)
import { getAuthUser, unauthorized, notFound, json } from '../../_auth.js';

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();

  const att = await env.DB.prepare(
    'SELECT r2_key FROM note_attachments WHERE id = ? AND user_id = ?'
  ).bind(params.id, user.id).first();
  if (!att) return notFound('Anexo não encontrado');

  await env.ATTACHMENTS.delete(att.r2_key);
  await env.DB.prepare('DELETE FROM note_attachments WHERE id = ? AND user_id = ?')
    .bind(params.id, user.id).run();

  return json({ ok: true });
}
