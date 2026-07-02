const https = require('https');

const GITHUB_USERNAME = 'isaacthisdel-hue';

function fetchFromGitHub(githubPath, req, res, depth) {
  if (depth > 3) {
    res.writeHead(508);
    return res.end('Too many redirects');
  }

  const options = {
    hostname: GITHUB_USERNAME + '.github.io',
    path: githubPath,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 Servision-Proxy/1.0',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Encoding': 'identity',
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const status = proxyRes.statusCode;
    const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';

    // Follow GitHub's own redirects internally (e.g. /path → /path/)
    if (status === 301 || status === 302) {
      const location = proxyRes.headers['location'] || '';
      // Extract just the path from the GitHub location header
      let newPath;
      try {
        const url = new URL(location);
        newPath = url.pathname;
      } catch {
        newPath = location;
      }
      // Follow it internally — don't redirect the browser
      return fetchFromGitHub(newPath, req, res, depth + 1);
    }

    res.writeHead(status, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end('Gateway error: ' + err.message);
  });

  proxyReq.end();
}

module.exports = (req, res) => {
  const rawPath = (req.url || '/').replace(/^\//, '');
  const parts = rawPath.split('/').filter(Boolean);

  if (parts.length === 0) {
    res.writeHead(302, { Location: 'https://servision.ca' });
    return res.end();
  }

  const restaurantSlug = parts[0];
  const rest = parts.slice(1).join('/');
  const repoName = 'ar-' + restaurantSlug;
  const githubPath = rest
    ? '/' + repoName + '/' + rest + '/'
    : '/' + repoName + '/';

  fetchFromGitHub(githubPath, req, res, 0);
};
