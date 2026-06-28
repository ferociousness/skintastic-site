// Cloudflare Worker — Travelpayouts API proxy
// Deploy at: workers.cloudflare.com
// Add secret: TRAVELPAYOUTS_TOKEN
// Set wrangler.toml name or deploy via dashboard

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const params = new URLSearchParams(url.searchParams);
    params.set('token', env.TRAVELPAYOUTS_TOKEN);

    const apiUrl = `https://api.travelpayouts.com/v1/prices/cheap?${params}`;
    const upstream = await fetch(apiUrl);
    const body = await upstream.text();

    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
};
