import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, phone, email, note, created_at, updated_at
       FROM customers
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения клиентов:', error);
    res.status(500).json({ error: 'Ошибка получения клиентов' });
  }
});

router.post('/', async (req, res) => {
  try {
    const fullName = String(req.body?.full_name || '').trim();
    const phone = String(req.body?.phone || '').trim() || null;
    const email = String(req.body?.email || '').trim() || null;
    const note = String(req.body?.note || '').trim() || null;

    if (!fullName) {
      return res.status(400).json({ error: 'Укажите имя клиента' });
    }

    const inserted = await pool.query(
      `INSERT INTO customers (full_name, phone, email, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, phone, email, note, created_at, updated_at`,
      [fullName, phone, email, note]
    );

    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Клиент с такими данными уже существует' });
    }
    console.error('Ошибка создания клиента:', error);
    res.status(500).json({ error: 'Ошибка создания клиента' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fullName = String(req.body?.full_name || '').trim();
    const phone = String(req.body?.phone || '').trim() || null;
    const email = String(req.body?.email || '').trim() || null;
    const note = String(req.body?.note || '').trim() || null;

    if (!fullName) {
      return res.status(400).json({ error: 'Укажите имя клиента' });
    }

    const updated = await pool.query(
      `UPDATE customers
       SET full_name = $1,
           phone = $2,
           email = $3,
           note = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, full_name, phone, email, note, created_at, updated_at`,
      [fullName, phone, email, note, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    res.json(updated.rows[0]);
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Клиент с такими данными уже существует' });
    }
    console.error('Ошибка обновления клиента:', error);
    res.status(500).json({ error: 'Ошибка обновления клиента' });
  }
});

export default router;
