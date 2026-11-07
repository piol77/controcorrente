// Controcorrente walkie-talkie: isolated LiveKit token endpoint.
// Secrets live in Cloudflare, NEVER in the GitHub Pages repository.
const SITE_ORIGIN = 'https://piol77.github.io';
const ROOM_NAME = 'controcorrente-walkie-v1';

function reply(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': SITE_ORIGIN,
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function encodedJson(value) {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

async function signToken(key, secret, grant, validSeconds = 600) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodedJson({ alg: 'HS256', typ: 'JWT' });
  const payload = encodedJson({
    iss: key,
    sub: 'anon-' + crypto.randomUUID(),
    iat: now,
    nbf: now - 5,
    exp: now + validSeconds,
    jti: crypto.randomUUID(),
    video: grant,
  });
  const body = header + '.' + payload;
  const hmac = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', hmac, new TextEncoder().encode(body))
  );
  return body + '.' + base64url(signature);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (url.pathname === '/health' && request.method === 'GET') {
      return reply({ ok: true, provider: 'livekit' });
    }
    if (url.pathname !== '/getToken' && url.pathname !== '/count') return reply({ error: 'Not found' }, 404);
    if (origin !== SITE_ORIGIN) return reply({ error: 'Origin not allowed' }, 403);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': SITE_ORIGIN,
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Max-Age': '600',
          'Vary': 'Origin',
        },
      });
    }
    if (url.pathname === '/count') {
      if (request.method !== 'GET') return reply({ error: 'Method not allowed' }, 405);
      if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET ||
          !/^wss:\/\/[a-z0-9.-]+\.livekit\.cloud$/i.test(env.LIVEKIT_URL || '')) {
        return reply({ error: 'LiveKit not configured' }, 503);
      }
      try {
        const listGrant = await signToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
          roomList: true
        }, 60);
        const result = await fetch(
          env.LIVEKIT_URL.replace(/^wss:/, 'https:') +
            '/twirp/livekit.RoomService/ListRooms',
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + listGrant,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ names: [ROOM_NAME] }),
            signal: AbortSignal.timeout(6500),
          }
        );
        if (!result.ok) throw Error('RoomService unavailable: ' + result.status);
        const data = await result.json();
        const targetRoom = (data.rooms || []).find(item => item.name === ROOM_NAME);
        const n = Number(targetRoom?.numParticipants ?? targetRoom?.num_participants ?? 0);
        return reply({ connected: Number.isSafeInteger(n) && n >= 0 ? n : 0 }, 200, {
          'Cache-Control': 'public, max-age=5',
        });
      } catch (_) {
        return reply({ error: 'Count unavailable' }, 502);
      }
    }
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) {
      return reply({ error: 'Expected JSON' }, 415);
    }
    const raw = await request.text();
    if (raw.length > 256) return reply({ error: 'Request too large' }, 413);
    // Anonymous site visitors may not choose identities, rooms or permissions.
    try {
      const data = JSON.parse(raw || '{}');
      if (!data || Array.isArray(data) || Object.keys(data).length) {
        return reply({ error: 'No client-supplied grants allowed' }, 400);
      }
    } catch (_) { return reply({ error: 'Invalid JSON' }, 400); }

    if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET ||
        !/^wss:\/\/[a-z0-9.-]+\.livekit\.cloud$/i.test(env.LIVEKIT_URL || '')) {
      return reply({ error: 'LiveKit not configured' }, 503);
    }
    // Approximate, per edge location; protects against accidental reconnect storms.
    // It is NOT user authentication; anonymous tokens should be restricted and monitored.
    if (env.TOKEN_RATE_LIMIT) {
      const key = request.headers.get('CF-Connecting-IP') || 'unknown';
      const result = await env.TOKEN_RATE_LIMIT.limit({ key });
      if (!result.success) return reply({ error: 'Too many requests' }, 429, {'Retry-After':'60'});
    }

    const token = await signToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      room: ROOM_NAME,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: ['microphone'],
      canPublishData: true,
      canUpdateOwnMetadata: false,
    });
    return reply({ server_url: env.LIVEKIT_URL, participant_token: token }, 201);
  },
};
