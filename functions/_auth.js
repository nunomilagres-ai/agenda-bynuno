// functions/_auth.js — agenda.bynuno.com auth delegado ao byNuno Hub

export function gid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida sessão via cookie partilhado Domain=.bynuno.com.
 * Garante que o utilizador existe localmente na tabela users.
 */
export async function getAuthUser(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  if (!cookieHeader.includes('session_id')) return null;

  let hubUser;
  try {
    const r = await fetch('https://bynuno.com/api/auth/me', {
      headers: { Cookie: cookieHeader },
    });
    if (!r.ok) return null;
    hubUser = await r.json();
  } catch {
    return null;
  }

  if (!hubUser?.id || !hubUser?.email) return null;

  const now = new Date().toISOString();

  // Upsert local user record
  let user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(hubUser.id).first();

  if (!user) {
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, avatar_url, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(hubUser.id, hubUser.email, hubUser.name, hubUser.avatar_url ?? null, now, now).run();
  } else if (user.name !== hubUser.name || user.avatar_url !== hubUser.avatar_url) {
    await env.DB.prepare(
      'UPDATE users SET name = ?, avatar_url = ?, updated_date = ? WHERE id = ?'
    ).bind(hubUser.name, hubUser.avatar_url ?? null, now, hubUser.id).run();
  }

  return {
    id:         hubUser.id,
    email:      hubUser.email,
    name:       hubUser.name,
    avatar_url: hubUser.avatar_url ?? null,
  };
}

export function unauthorized(msg = 'Não autenticado') {
  return Response.json({ error: msg }, { status: 401 });
}

export function badRequest(msg = 'Pedido inválido') {
  return Response.json({ error: msg }, { status: 400 });
}

export function notFound(msg = 'Não encontrado') {
  return Response.json({ error: msg }, { status: 404 });
}

export function json(data, status = 200) {
  return Response.json(data, { status });
}
