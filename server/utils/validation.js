import { isIP } from 'node:net';

const SQL_INJECTION_PATTERNS = [
  /(?:'|\")\s*(?:or|and)\s+\d+\s*=\s*\d+/i,
  /;\s*(?:drop|truncate|delete|insert|update|alter|create|grant|revoke)\b/i,
  /\/\*[\s\S]*?\*\//,
  /--\s*$/m,
  /\bunion\b[\s\S]{0,40}\bselect\b/i,
];

const XSS_PATTERNS = [
  /<\s*script\b/i,
  /javascript\s*:/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /\bon\w+\s*=/i,
  /<\s*svg\b/i,
];

export function sanitizeTextInput(value, { maxLength = 4000, trim = true } = {}) {
  let next = String(value ?? '');
  try {
    next = next.normalize('NFKC');
  } catch {
    // ignore normalization errors
  }

  next = next
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|base|meta|link)[^>]*>/gi, '')
    .replace(/\s*on[a-z]+\s*=\s*([\"']).*?\1/gi, '')
    .replace(/javascript\s*:/gi, '');

  if (trim) next = next.trim();
  if (Number.isFinite(maxLength) && maxLength > 0 && next.length > maxLength) {
    next = next.slice(0, maxLength);
  }

  return next;
}

export function hasSQLInjection(str) {
  if (!str || typeof str !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(str));
}

export function hasXSSPayload(str) {
  if (!str || typeof str !== 'string') return false;
  return XSS_PATTERNS.some((pattern) => pattern.test(str));
}

export function validateEmail(email) {
  const clean = sanitizeTextInput(email, { maxLength: 255 });
  if (!clean) return { valid: false, error: 'Email обязателен' };
  if (hasSQLInjection(clean) || hasXSSPayload(clean)) return { valid: false, error: 'Недопустимый email' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) return { valid: false, error: 'Неверный формат email' };
  return { valid: true, value: clean };
}

export function validateName(name) {
  const clean = sanitizeTextInput(name, { maxLength: 255 });
  if (!clean) return { valid: false, error: 'Имя обязательно' };
  if (hasSQLInjection(clean) || hasXSSPayload(clean)) return { valid: false, error: 'Недопустимое имя' };

  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-'.]+$/u;
  if (!nameRegex.test(clean)) {
    return { valid: false, error: 'Имя может содержать только буквы, пробелы, дефисы и апостроф' };
  }
  return { valid: true, value: clean };
}

export function validatePhone(phone) {
  const clean = sanitizeTextInput(phone, { maxLength: 50 });
  if (!clean) return { valid: false, error: 'Телефон обязателен' };
  if (hasSQLInjection(clean) || hasXSSPayload(clean)) return { valid: false, error: 'Недопустимый телефон' };

  const phoneRegex = /^[\d\s()+\-]{5,50}$/;
  if (!phoneRegex.test(clean)) {
    return { valid: false, error: 'Телефон может содержать только цифры и знаки форматирования' };
  }
  return { valid: true, value: clean };
}

export function validateSearchQuery(query) {
  if (query == null || query === '') return { valid: true, value: '' };
  const clean = sanitizeTextInput(query, { maxLength: 500 });
  if (hasSQLInjection(clean) || hasXSSPayload(clean)) return { valid: false, error: 'Недопустимый поисковый запрос' };
  return { valid: true, value: clean };
}

export function validateId(id) {
  if (id == null || id === '') return { valid: false, error: 'ID обязателен' };
  const numId = Number.parseInt(String(id), 10);
  if (!Number.isInteger(numId) || numId <= 0) {
    return { valid: false, error: 'ID должен быть положительным целым числом' };
  }
  return { valid: true, value: numId };
}

export function validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Число обязательно' };
  }
  const num = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  if (!Number.isFinite(num)) return { valid: false, error: 'Неверный формат числа' };
  if (num < min) return { valid: false, error: `Число должно быть не меньше ${min}` };
  if (num > max) return { valid: false, error: `Число должно быть не больше ${max}` };
  return { valid: true, value: num };
}

export function validateString(str, fieldName = 'Поле', minLength = 0, maxLength = 1000, allowEmpty = true) {
  const clean = sanitizeTextInput(str, { maxLength, trim: true });
  if (!clean && !allowEmpty) return { valid: false, error: `${fieldName} обязательно` };
  if (!clean && allowEmpty) return { valid: true, value: '' };
  if (clean.length < minLength) {
    return { valid: false, error: `${fieldName} слишком короткое (минимум ${minLength} символов)` };
  }
  if (hasSQLInjection(clean) || hasXSSPayload(clean)) {
    return { valid: false, error: `Недопустимое значение поля ${fieldName}` };
  }
  return { valid: true, value: clean };
}

export function validateIP(ip) {
  const clean = sanitizeTextInput(ip, { maxLength: 64 });
  if (!clean) return { valid: false, error: 'IP адрес обязателен' };
  if (hasSQLInjection(clean) || hasXSSPayload(clean)) return { valid: false, error: 'Недопустимый IP адрес' };
  if (!isIP(clean)) return { valid: false, error: 'Неверный формат IP адреса' };
  return { valid: true, value: clean };
}

function normalizePossibleIp(value) {
  if (!value) return '';
  let ip = String(value).trim();
  if (!ip) return '';

  // x-forwarded-for can contain a list
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  ip = ip.replace(/^\[|\]$/g, '');

  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  if (ip === '::1') return '127.0.0.1';
  return ip;
}

export function getClientIP(req) {
  const candidates = [
    req.headers['x-forwarded-for'],
    req.headers['x-real-ip'],
    req.headers['cf-connecting-ip'],
    req.ip,
    req.connection?.remoteAddress,
    req.socket?.remoteAddress,
  ];

  for (const candidate of candidates) {
    const ip = normalizePossibleIp(candidate);
    if (ip && isIP(ip)) return ip;
  }

  return 'unknown';
}
