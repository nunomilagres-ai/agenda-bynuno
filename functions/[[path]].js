export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Serve static assets first
  const assetResponse = await context.env.ASSETS.fetch(context.request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  // SPA fallback — all routes serve index.html
  return context.env.ASSETS.fetch(new Request(new URL('/index.html', url)));
}
