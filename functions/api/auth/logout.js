// POST /api/auth/logout — apaga cookie de sessão local (a sessão hub é gerida pelo bynuno.com)
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session_id=; Path=/; Domain=.bynuno.com; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
    },
  });
}
