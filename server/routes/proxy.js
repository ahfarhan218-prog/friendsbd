const express = require('express');
const router = express.Router();

router.get('/stream', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('URL is required');
  }

  try {
    const proxyRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*'
      }
    });

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
