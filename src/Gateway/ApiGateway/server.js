const http = require('http');

let cachedApiId = null;

async function resolveApiId() {
  if (cachedApiId) return cachedApiId;
  try {
    const res = await fetch('http://floci:4566/v2/apis');
    if (!res.ok) return null;
    const data = await res.json();
    const gw = (data.items || []).find((i) => i.name === 'learnhub-gateway') || data.items?.[0];
    if (gw?.apiId) {
      cachedApiId = gw.apiId;
      console.log(`[API-Gateway] Discovered Amazon API Gateway ID: ${cachedApiId}`);
      return cachedApiId;
    }
  } catch (err) {
    // Floci might still be initializing
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const apiId = await resolveApiId();
  if (!apiId) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Amazon API Gateway is initializing on Floci...' }));
    return;
  }

  const options = {
    hostname: 'floci',
    port: 4566,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${apiId}.execute-api.localhost.floci.io:4566`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    cachedApiId = null; // Invalidate cache in case gateway was recreated
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Error forwarding to Amazon API Gateway', error: err.message }));
  });

  req.pipe(proxyReq);
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
  console.log(`[API-Gateway] Amazon API Gateway Bridge listening on port ${PORT}`);
});
