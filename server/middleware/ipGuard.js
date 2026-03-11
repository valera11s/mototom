function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function createIpGuard(pool) {
  const memoryRate = new Map();
  const blockedCache = new Set();
  let lastBlockedRefresh = 0;
  const WINDOW_MS = Number(process.env.IP_RATE_WINDOW_MS || 60_000);
  const MAX_REQUESTS_PER_WINDOW = Number(process.env.IP_RATE_LIMIT || 400);
  const BLOCK_REFRESH_MS = 30_000;

  return async function ipGuard(req, res, next) {
    try {
      const ip = getClientIp(req);
      if (!ip || ip === 'unknown') return next();

      const now = Date.now();
      if (now - lastBlockedRefresh > BLOCK_REFRESH_MS) {
        const blocked = await pool.query('SELECT ip_address FROM blocked_ips');
        blockedCache.clear();
        blocked.rows.forEach((row) => blockedCache.add(row.ip_address));
        lastBlockedRefresh = now;
      }

      if (blockedCache.has(ip)) {
        return res.status(403).json({ error: 'IP заблокирован' });
      }

      const current = memoryRate.get(ip) || { count: 0, start: now };
      if (now - current.start > WINDOW_MS) {
        current.count = 0;
        current.start = now;
      }
      current.count += 1;
      memoryRate.set(ip, current);

      if (current.count > MAX_REQUESTS_PER_WINDOW) {
        await pool.query(
          `INSERT INTO blocked_ips (ip_address, reason, blocked_by, request_count)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (ip_address) DO UPDATE
           SET reason = EXCLUDED.reason,
               blocked_by = EXCLUDED.blocked_by,
               request_count = GREATEST(blocked_ips.request_count, EXCLUDED.request_count),
               blocked_at = CURRENT_TIMESTAMP`,
          [ip, `Auto-block: too many requests (${current.count}/${WINDOW_MS}ms)`, 'system', current.count]
        );
        blockedCache.add(ip);
        return res.status(429).json({ error: 'Слишком много запросов. IP заблокирован автоматически.' });
      }

      next();
    } catch (error) {
      console.error('IP guard error:', error);
      next();
    }
  };
}
