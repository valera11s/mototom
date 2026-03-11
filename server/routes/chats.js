import express from 'express';
import { pool } from '../index.js';
import { notifyNewChat, notifyNewMessageInChat } from '../utils/telegram.js';

const router = express.Router();

// Получить все чаты (для админки)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        c.*,
        COUNT(cm.id) as messages_count,
        MAX(cm.created_at) as last_message_at,
        (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id AND sender = 'user' AND is_read = false) as unread_count
      FROM chats c
      LEFT JOIN chat_messages cm ON c.id = cm.chat_id
    `;
    const params = [];

    if (status) {
      query += ' WHERE c.status = $1';
      params.push(status);
    }

    query += ' GROUP BY c.id ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    res.status(500).json({ error: 'Ошибка получения чатов' });
  }
});

// Получить чат по ID с сообщениями
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем информацию о чате
    const chatResult = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    // Получаем все сообщения чата
    const messagesResult = await pool.query(
      'SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      ...chatResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error('Ошибка получения чата:', error);
    res.status(500).json({ error: 'Ошибка получения чата' });
  }
});

// Получить или создать чат для пользователя по session_id
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Пытаемся найти существующий активный чат
    let chatResult = await pool.query(
      'SELECT * FROM chats WHERE session_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [sessionId, 'active']
    );

    let chat;
    if (chatResult.rows.length === 0) {
      // Создаем новый чат
      const createResult = await pool.query(
        'INSERT INTO chats (session_id, status) VALUES ($1, $2) RETURNING *',
        [sessionId, 'active']
      );
      chat = createResult.rows[0];
    } else {
      chat = chatResult.rows[0];
    }

    // Получаем сообщения чата
    const messagesResult = await pool.query(
      'SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [chat.id]
    );

    res.json({
      ...chat,
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error('Ошибка получения/создания чата:', error);
    res.status(500).json({ error: 'Ошибка получения чата' });
  }
});

// Отправить сообщение в чат (от пользователя)
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, user_name, user_email, user_phone } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    // Проверяем существование чата
    const chatResult = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    const chat = chatResult.rows[0];

    // Обновляем данные пользователя в чате, если они переданы
    if (user_name || user_email || user_phone) {
      await pool.query(
        'UPDATE chats SET user_name = COALESCE($1, user_name), user_email = COALESCE($2, user_email), user_phone = COALESCE($3, user_phone) WHERE id = $4',
        [user_name || null, user_email || null, user_phone || null, id]
      );
    }

    // Создаем сообщение
    const messageResult = await pool.query(
      'INSERT INTO chat_messages (chat_id, message, sender) VALUES ($1, $2, $3) RETURNING *',
      [id, message.trim(), 'user']
    );

    const newMessage = messageResult.rows[0];

    // Получаем обновленный чат для проверки количества сообщений
    const updatedChatResult = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
    const updatedChat = updatedChatResult.rows[0];
    
    // Получаем все сообщения чата для подсчета
    const allMessagesResult = await pool.query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE chat_id = $1 AND sender = $2',
      [id, 'user']
    );
    const messageCount = parseInt(allMessagesResult.rows[0].count || 0);

    // Отправляем уведомление в Telegram, если это первое сообщение от пользователя
    if (messageCount === 1) {
      try {
        const finalChat = updatedChatResult.rows[0];
        await notifyNewChat(finalChat, newMessage);
      } catch (error) {
        console.error('Ошибка отправки уведомления о новом чате в Telegram:', error);
        // Не прерываем создание сообщения из-за ошибки уведомления
      }
    } else {
      // Проверяем, когда было последнее сообщение (от админа или пользователя)
      const lastMessageResult = await pool.query(
        `SELECT created_at FROM chat_messages 
         WHERE chat_id = $1 AND id != $2
         ORDER BY created_at DESC LIMIT 1`,
        [id, newMessage.id]
      );

      if (lastMessageResult.rows.length > 0) {
        const lastMessageTime = new Date(lastMessageResult.rows[0].created_at);
        const now = new Date();
        const hoursSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60); // В часах

        // Если прошло более 2.5 часов (2-3 часа, берем среднее) с последнего сообщения
        if (hoursSinceLastMessage >= 2.5) {
          try {
            await notifyNewMessageInChat(updatedChat, newMessage);
          } catch (error) {
            console.error('Ошибка отправки уведомления о новом сообщении в старом чате в Telegram:', error);
            // Не прерываем создание сообщения из-за ошибки уведомления
          }
        }
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// Отправить сообщение в чат (от администратора)
router.post('/:id/messages/admin', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, admin_id } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    // Проверяем существование чата
    const chatResult = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    // Создаем сообщение от админа
    const messageResult = await pool.query(
      'INSERT INTO chat_messages (chat_id, message, sender, admin_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, message.trim(), 'admin', admin_id || null]
    );

    res.status(201).json(messageResult.rows[0]);
  } catch (error) {
    console.error('Ошибка отправки сообщения от админа:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// Отметить сообщения как прочитанные
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE chat_messages SET is_read = true WHERE chat_id = $1 AND sender = $2 RETURNING *',
      [id, 'user']
    );

    res.json({ updated: result.rowCount });
  } catch (error) {
    console.error('Ошибка обновления статуса прочтения:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

// Закрыть чат
router.patch('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE chats SET status = $1 WHERE id = $2 RETURNING *',
      ['closed', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Чат не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка закрытия чата:', error);
    res.status(500).json({ error: 'Ошибка закрытия чата' });
  }
});

export default router;

