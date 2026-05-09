/**
 * Cross-origin-isolated dev proxy.
 *
 * The Expo dev server doesn't set the COOP/COEP headers that browsers require
 * to expose `SharedArrayBuffer`. wa-sqlite (used by `expo-sqlite` on web)
 * needs `SharedArrayBuffer`, so without isolation the app boots and
 * immediately fails with "SharedArrayBuffer is not defined".
 *
 * This proxy forwards every request to the Metro dev server and rewrites
 * the response headers to make the page cross-origin-isolated.
 *
 *   npm run web         # plain Metro on 8081 (no isolation; native dev only)
 *   npm run web:isolated  # this proxy on 8082, forwards to Metro on 8081
 *
 * Open http://localhost:8082 in the browser when developing the web build.
 */

import http from 'node:http';

const UPSTREAM_HOST = process.env.UPSTREAM_HOST ?? 'localhost';
const UPSTREAM_PORT = Number(process.env.UPSTREAM_PORT ?? 8081);
const LISTEN_PORT = Number(process.env.LISTEN_PORT ?? 8082);

function addIsolationHeaders(headers) {
  const out = { ...headers };
  // Strip any upstream values so we control them.
  for (const k of Object.keys(out)) {
    if (k.toLowerCase().startsWith('cross-origin-')) delete out[k];
  }
  out['Cross-Origin-Opener-Policy'] = 'same-origin';
  out['Cross-Origin-Embedder-Policy'] = 'require-corp';
  out['Cross-Origin-Resource-Policy'] = 'same-origin';
  return out;
}

const server = http.createServer((req, res) => {
  const upstreamReq = http.request(
    {
      host: UPSTREAM_HOST,
      port: UPSTREAM_PORT,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}` },
    },
    (upstreamRes) => {
      const headers = addIsolationHeaders(upstreamRes.headers);
      res.writeHead(upstreamRes.statusCode ?? 200, headers);
      upstreamRes.pipe(res);
    },
  );
  upstreamReq.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`dev-proxy: upstream error: ${err.message}`);
  });
  req.pipe(upstreamReq);
});

server.on('upgrade', (req, socket, head) => {
  // Forward WebSocket upgrades (Metro HMR uses ws://)
  const upstream = http.request({
    host: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    method: req.method,
    path: req.url,
    headers: req.headers,
  });
  upstream.on('upgrade', (upstreamRes, upstreamSocket) => {
    const head = [
      `HTTP/1.1 ${upstreamRes.statusCode} ${upstreamRes.statusMessage}`,
      ...Object.entries(upstreamRes.headers).map(([k, v]) => `${k}: ${v}`),
      '',
      '',
    ].join('\r\n');
    socket.write(head);
    upstreamSocket.pipe(socket);
    socket.pipe(upstreamSocket);
  });
  upstream.on('error', () => socket.destroy());
  upstream.end();
});

server.listen(LISTEN_PORT, () => {
  console.log(
    `dev-proxy listening on http://localhost:${LISTEN_PORT} → http://${UPSTREAM_HOST}:${UPSTREAM_PORT}`,
  );
  console.log('cross-origin-isolated headers injected (SharedArrayBuffer enabled).');
});
