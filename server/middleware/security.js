import { hasSQLInjection, hasXSSPayload, sanitizeTextInput } from '../utils/validation.js';

function sanitizeValue(value, depth = 0) {
  if (depth > 12) return value;

  if (typeof value === 'string') {
    return sanitizeTextInput(value, { maxLength: 10_000, trim: true });
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const next = {};
    Object.keys(value).forEach((key) => {
      next[key] = sanitizeValue(value[key], depth + 1);
    });
    return next;
  }

  return value;
}

function findSuspiciousString(value, path = 'root', depth = 0) {
  if (depth > 12) return null;

  if (typeof value === 'string') {
    if (hasXSSPayload(value)) {
      return { path, type: 'xss' };
    }
    if (hasSQLInjection(value)) {
      return { path, type: 'sql' };
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const nested = findSuspiciousString(value[i], `${path}[${i}]`, depth + 1);
      if (nested) return nested;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const nested = findSuspiciousString(value[key], `${path}.${key}`, depth + 1);
      if (nested) return nested;
    }
  }

  return null;
}

export function applySecurityHeaders() {
  return function securityHeaders(_req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
  };
}

export function sanitizeIncomingPayload() {
  return function sanitizePayload(req, _res, next) {
    if (req.query) req.query = sanitizeValue(req.query);
    if (req.params) req.params = sanitizeValue(req.params);
    if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
    next();
  };
}

export function rejectMaliciousPayload() {
  return function suspiciousGuard(req, res, next) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const sources = [
      { name: 'body', value: req.body },
      { name: 'query', value: req.query },
      { name: 'params', value: req.params },
    ];

    for (const source of sources) {
      const hit = findSuspiciousString(source.value, source.name);
      if (hit) {
        return res.status(400).json({
          error: 'Запрос отклонен системой безопасности',
          reason: `Обнаружен потенциально опасный ввод (${hit.type}) в ${hit.path}`,
        });
      }
    }

    return next();
  };
}

export function enforceJsonForMutations() {
  return function contentTypeGuard(req, res, next) {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
    if (req.path.startsWith('/api/upload') || req.path.startsWith('/upload')) return next();

    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (!contentType || contentType.includes('application/json') || contentType.includes('application/x-www-form-urlencoded')) {
      return next();
    }

    return res.status(415).json({ error: 'Unsupported Content-Type. Use application/json.' });
  };
}
