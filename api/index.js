// Servision AR Proxy
// ar.servision.ca/bella-italia/downtown/margherita-pizza
// → proxies everything from isaacthisdel.github.io/ar-bella-italia/downtown/margherita-pizza
// URL stays on ar.servision.ca the whole time

const https = require('https');

const GITHUB_USERNAME = 'isaacthisdel-hue';

module.exports = (req, res) => {
  const rawPath = (req.url || '/').replace(/^\//, '');
  const parts = rawPath.split('/').filter(Boolean);

  // Root hit
  if (parts.length === 0) {
    res.writeHead(302, { Location: 'https://servision.ca' });
    return res.end();
  }

  const restaurantSlug = parts[0];
  const rest = parts.slice(1).join('/');
  const repoName = 'ar-' + restaurantSlug;

  // Build the GitHub Pages path
  // ar.servision.ca/bella-italia/downtown/margherita-pizza/model.glb
  // → isaacthisdel.github.io/ar-bella-italia/downtown/margherita-pizza/model.glb
  const githubPath = rest ? '/' + repoName + '/' + rest : '/' + repoName + '/';

  const options = {
    hostname: GITHUB_USERNAME + '.github.io',
    path: githubPath,
    method: req.method || 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 Servision-Proxy/1.0',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Encoding': 'identity', // avoid compressed responses we can't pipe cleanly
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const status = proxyRes.statusCode;
    const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';

    // Handle GitHub Pages redirects (e.g. /repo → /repo/)
    if (status === 301 || status === 302) {
      const location = proxyRes.headers['location'] || '';
      // Rewrite github.io URLs back to ar.servision.ca
      const rewritten = location
        .replace('https://' + GITHUB_USERNAME + '.github.io/' + repoName, 'https://ar.servision.ca/' + restaurantSlug)
        .replace('http://' + GITHUB_USERNAME + '.github.io/' + repoName, 'https://ar.servision.ca/' + restaurantSlug);
      res.writeHead(302, { 'Location': rewritten });
      return res.end();
    }

    res.writeHead(status, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'X-Powered-By': 'Servision'
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end('Gateway error');
  });

  proxyReq.end();
};
