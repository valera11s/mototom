import express from 'express';
import { pool } from '../index.js';
import { validateIP, validateString } from '../utils/validation.js';

const router = express.Router();

// Получить все заблокированные IP
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blocked_ips ORDER BY blocked_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заблокированных IP:', error);
    res.status(500).json({ error: 'Ошибка получения заблокированных IP' });
  }
});

// Заблокировать IP
router.post('/', async (req, res) => {
  try {
    const { ip_address, reason } = req.body;

    // Валидация IP
    const ipValidation = validateIP(ip_address);
    if (!ipValidation.valid) {
      return res.status(400).json({ error: ipValidation.error });
    }

    // Валидация причины (опционально)
    if (reason) {
      const reasonValidation = validateString(reason, 'Причина', 0, 500, true);
      if (!reasonValidation.valid) {
        return res.status(400).json({ error: reasonValidation.error });
      }
    }

    // Проверяем, не заблокирован ли уже этот IP
    const existing = await pool.query(
      'SELECT id FROM blocked_ips WHERE ip_address = $1',
      [ip_address]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Этот IP уже заблокирован' });
    }

    const result = await pool.query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ip_address, reason || null, req.body.blocked_by || 'admin']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка блокировки IP:', error);
    res.status(500).json({ error: 'Ошибка блокировки IP' });
  }
});

// Разблокировать IP
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM blocked_ips WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP не найден' });
    }

    res.json({ message: 'IP разблокирован', data: result.rows[0] });
  } catch (error) {
    console.error('Ошибка разблокировки IP:', error);
    res.status(500).json({ error: 'Ошибка разблокировки IP' });
  }
});

// Разблокировать IP по адресу
router.delete('/ip/:ip_address', async (req, res) => {
  try {
    const { ip_address } = req.params;

    const ipValidation = validateIP(ip_address);
    if (!ipValidation.valid) {
      return res.status(400).json({ error: ipValidation.error });
    }

    const result = await pool.query(
      'DELETE FROM blocked_ips WHERE ip_address = $1 RETURNING *',
      [ip_address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'IP не найден' });
    }

    res.json({ message: 'IP разблокирован', data: result.rows[0] });
  } catch (error) {
    console.error('Ошибка разблокировки IP:', error);
    res.status(500).json({ error: 'Ошибка разблокировки IP' });
  }
});

export default router;



