// GET /api/auth/me — retorna utilizador autenticado (delegado ao bynuno.com hub)
import { getAuthUser, unauthorized, json } from '../../_auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getAuthUser(request, env);
  if (!user) return unauthorized();
  return json(user);
}
