/**
 * Dev-only NDJSON sink: receives POST bodies from analytics.ts and appends to a repo-local file.
 * Run: yarn analytics-sink (from mobile/cosmo-miner)
 *
 * Env:
 *   ANALYTICS_SINK_PORT — default 28765
 *   ANALYTICS_SINK_FILE — override output path (absolute or relative to cwd)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.ANALYTICS_SINK_PORT || 28765);
const defaultOut = path.join(__dirname, '..', 'dev-logs', 'cosmo_analytics.ndjson');
const OUT = process.env.ANALYTICS_SINK_FILE
  ? path.isAbsolute(process.env.ANALYTICS_SINK_FILE)
    ? process.env.ANALYTICS_SINK_FILE
    : path.resolve(process.cwd(), process.env.ANALYTICS_SINK_FILE)
  : defaultOut;

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(404, cors);
    res.end();
    return;
  }
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    try {
      const body = Buffer.concat(chunks).toString('utf8');
      if (body.length > 0) {
        fs.appendFileSync(OUT, body.endsWith('\n') ? body : `${body}\n`, 'utf8');
      }
      res.writeHead(204, cors);
      res.end();
    } catch (e) {
      res.writeHead(500, cors);
      res.end(String(e));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`analytics-dev-sink http://0.0.0.0:${PORT} → ${OUT}`);
});
