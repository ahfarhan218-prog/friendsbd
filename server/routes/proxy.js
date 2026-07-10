const express = require('express');
const router = express.Router();

// Allowlisted streaming domains only
const ALLOWED_STREAM_DOMAINS = [
  'iptv-org.github.io',
  'test-streams.mux.dev',
  'cdn77.com',
  'cdn.iptv.design',
  'img.iptv.design',
  'live.iptv.design',
  'stream.iptv.design'
];

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_STREAM_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

const PROXY_TIMEOUT_MS = 10000;

router.get('/stream', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('URL is required');
  }

  if (!isAllowedUrl(targetUrl)) {
    return res.status(403).send('Proxying this URL is not allowed.');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
    const proxyRes = await fetch(targetUrl, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*'
      }
    });
    clearTimeout(timeout);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Copy safe headers from target response
    proxyRes.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['access-control-allow-origin', 'content-length', 'connection', 'content-encoding'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    });

    const contentType = proxyRes.headers.get('content-type') || '';
    
    if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
      // It's a playlist. Rewrite relative URLs.
      const body = await proxyRes.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const lines = body.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('#')) {
          let absoluteUrl = line;
          if (!line.startsWith('http')) {
             try {
               absoluteUrl = new URL(line, baseUrl).href;
             } catch(e) {
               absoluteUrl = baseUrl + line;
             }
          }
          lines[i] = `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
        }
      }
      
      const modifiedBody = lines.join('\n');
      res.setHeader('Content-Type', contentType || 'application/vnd.apple.mpegurl');
      res.status(proxyRes.status).send(modifiedBody);
    } else {
      // It's a binary segment (.ts), pipe it directly
      res.status(proxyRes.status);
      if (proxyRes.body) {
        try {
          for await (const chunk of proxyRes.body) {
            res.write(chunk);
          }
        } catch (err) {
          console.error('Stream pipe error:', err.message);
        }
      }
      res.end();
    }
  } catch (error) {
    console.error('Proxy Fetch Error:', error.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).send('Proxy Error: ' + error.message);
  }
});

module.exports = router;
