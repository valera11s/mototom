import express from 'express';
import { pool } from '../index.js';
import { notifyNewMessage } from '../utils/telegram.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, message_type } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (message_type) {
      params.push(message_type);
      conditions.push(`message_type = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`SELECT * FROM messages ${where} ORDER BY created_at DESC`, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения сообщения:', error);
    res.status(500).json({ error: 'Ошибка получения сообщения' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message, message_type } = req.body;

    const type = String(message_type || '').trim() || (phone && !message ? 'callback' : 'feedback');
    const trimmedName = String(name || '').trim();
    const trimmedPhone = String(phone || '').trim();
    const trimmedEmail = String(email || '').trim();
    const trimmedMessage = String(message || '').trim() || (type === 'callback' ? 'Запрос обратного звонка' : '');

    if (!trimmedName && type !== 'callback') {
      return res.status(400).json({ error: 'Имя обязательно для заполнения' });
    }
    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Сообщение обязательно для заполнения' });
    }
    if (type === 'callback' && !trimmedPhone) {
      return res.status(400).json({ error: 'Телефон обязателен для обратного звонка' });
    }

    const result = await pool.query(
      `INSERT INTO messages (name, phone, email, message, message_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [trimmedName || 'Клиент', trimmedPhone || null, trimmedEmail || null, trimmedMessage, type]
    );

    const newMessage = result.rows[0];

    try {
      await notifyNewMessage(newMessage);
    } catch (error) {
      console.error('Ошибка отправки уведомления в Telegram:', error);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Ошибка создания сообщения:', error);
    res.status(500).json({ error: 'Ошибка создания сообщения' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Статус обязателен' });
    }

    const result = await pool.query(
      'UPDATE messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления сообщения:', error);
    res.status(500).json({ error: 'Ошибка обновления сообщения' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    res.json({ message: 'Сообщение удалено', data: result.rows[0] });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error);
    res.status(500).json({ error: 'Ошибка удаления сообщения' });
  }
});

export default router;
