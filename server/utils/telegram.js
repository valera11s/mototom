// Утилита для отправки уведомлений в Telegram

/**
 * Получает токен Telegram бота из переменных окружения
 */
function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

/**
 * Получает ID чата Telegram из переменных окружения
 */
function getTelegramChatId() {
  return process.env.TELEGRAM_CHAT_ID;
}

/**
 * Отправляет сообщение в Telegram
 * @param {string} message - Текст сообщения
 * @returns {Promise<boolean>} - true если успешно, false если ошибка
 */
export async function sendTelegramMessage(message) {
  const TELEGRAM_BOT_TOKEN = getTelegramBotToken();
  const TELEGRAM_CHAT_ID = getTelegramChatId();

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Telegram не настроен: TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не установлены');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Ошибка отправки в Telegram:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Ошибка отправки сообщения в Telegram:', error);
    return false;
  }
}

/**
 * Отправляет уведомление о новом заказе
 * @param {object} order - Объект заказа
 */
export async function notifyNewOrder(order) {
  const itemsText = order.items
    ?.map((item, index) => {
      const itemNum = index + 1;
      return `${itemNum}. ${item.product_name} x${item.quantity} - ${item.price ? (item.price * item.quantity).toLocaleString('ru-RU') : 0} ₽`;
    })
    .join('\n') || 'Товары не указаны';

  const address = order.shipping_address || {};
  const addressText = `${address.full_name || ''}\n${address.address || ''}, ${address.city || ''}, ${address.postal_code || ''}\nТел: ${address.phone || 'не указан'}`;

  const message = `🛒 <b>Новый заказ!</b>

📦 <b>Номер заказа:</b> ${order.order_number || 'N/A'}
👤 <b>Клиент:</b> ${order.customer_name || 'не указано'}
📧 <b>Email:</b> ${order.customer_email || 'не указан'}
💰 <b>Сумма:</b> ${order.total ? order.total.toLocaleString('ru-RU') : 0} ₽

📋 <b>Товары:</b>
${itemsText}

📍 <b>Адрес доставки:</b>
${addressText}

⏰ <b>Время:</b> ${new Date(order.created_at || Date.now()).toLocaleString('ru-RU')}`;

  return await sendTelegramMessage(message);
}

/**
 * Отправляет уведомление о новом сообщении от пользователя
 * @param {object} message - Объект сообщения
 */
export async function notifyNewMessage(message) {
  const messageText = `💬 <b>Новое сообщение от пользователя!</b>

👤 <b>Имя:</b> ${message.name || 'не указано'}
📧 <b>Email:</b> ${message.email || 'не указан'}
📱 <b>Телефон:</b> ${message.phone || 'не указан'}

💬 <b>Сообщение:</b>
${message.message || 'нет текста'}

⏰ <b>Время:</b> ${new Date(message.created_at || Date.now()).toLocaleString('ru-RU')}`;

  return await sendTelegramMessage(messageText);
}

/**
 * Отправляет уведомление о первом сообщении в чате от нового пользователя
 * @param {object} chat - Объект чата
 * @param {object} firstMessage - Первое сообщение
 */
export async function notifyNewChat(chat, firstMessage) {
  const userInfo = chat.user_name ? `👤 <b>Имя:</b> ${chat.user_name}` : '';
  const userEmail = chat.user_email ? `📧 <b>Email:</b> ${chat.user_email}` : '';
  const userPhone = chat.user_phone ? `📱 <b>Телефон:</b> ${chat.user_phone}` : '';

  const message = `💬 <b>Новый чат от пользователя!</b>

${userInfo}
${userEmail}
${userPhone}

💬 <b>Первое сообщение:</b>
${firstMessage.message || 'нет текста'}

🔗 <b>Перейти в админку для ответа</b>

⏰ <b>Время:</b> ${new Date(firstMessage.created_at || Date.now()).toLocaleString('ru-RU')}`;

  return await sendTelegramMessage(message);
}

/**
 * Отправляет уведомление о новом сообщении в старом чате (если прошло более 2-3 часов)
 * @param {object} chat - Объект чата
 * @param {object} newMessage - Новое сообщение от пользователя
 */
export async function notifyNewMessageInChat(chat, newMessage) {
  const userInfo = chat.user_name ? `👤 <b>Имя:</b> ${chat.user_name}` : '';
  const userEmail = chat.user_email ? `📧 <b>Email:</b> ${chat.user_email}` : '';
  const userPhone = chat.user_phone ? `📱 <b>Телефон:</b> ${chat.user_phone}` : '';

  const message = `💬 <b>Новое сообщение в чате!</b>

${userInfo}
${userEmail}
${userPhone}

💬 <b>Сообщение:</b>
${newMessage.message || 'нет текста'}

🔗 <b>Перейти в админку для ответа</b>

⏰ <b>Время:</b> ${new Date(newMessage.created_at || Date.now()).toLocaleString('ru-RU')}`;

  return await sendTelegramMessage(message);
}

