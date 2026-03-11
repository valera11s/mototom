import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [showUserInfoForm, setShowUserInfoForm] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Инициализация сессии
    let sid = localStorage.getItem('guest_session');
    if (!sid) {
      sid = 'guest_' + Date.now();
      localStorage.setItem('guest_session', sid);
    }
    setSessionId(sid);

    // Загружаем сохраненные данные пользователя из localStorage
    const savedUserInfo = localStorage.getItem('chat_user_info');
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo));
      } catch (e) {
        console.error('Ошибка загрузки данных пользователя:', e);
      }
    }
  }, []);

  // Показываем всплывающий текст раз в пол минуты
  useEffect(() => {
    if (!isOpen) {
      const showTooltipInterval = setInterval(() => {
        setShowTooltip(true);
        // Скрываем через 4 секунды
        setTimeout(() => {
          setShowTooltip(false);
        }, 4000);
      }, 30000); // 30 секунд = пол минуты

      return () => clearInterval(showTooltipInterval);
    }
  }, [isOpen]);

  useEffect(() => {
    // Автоскролл к последнему сообщению
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadChat();
      // Автоматическое обновление сообщений каждые 2 секунды
      const interval = setInterval(() => {
        loadChat();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId]);

  const loadChat = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/chats/session/${sessionId}`);
      if (!response.ok) throw new Error('Ошибка загрузки чата');
      const chat = await response.json();
      setChatId(chat.id);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (!chatId) return;

    setIsLoading(true);
    const currentMessage = messageText.trim();
    setMessageText('');

    try {
      const response = await fetch(`${apiUrl}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          user_name: userInfo.name || null,
          user_email: userInfo.email || null,
          user_phone: userInfo.phone || null,
        }),
      });

      if (!response.ok) throw new Error('Ошибка отправки сообщения');
      const newMessage = await response.json();
      setMessages((prev) => [...prev, newMessage]);
      // Обновляем чат после отправки
      await loadChat();
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Не удалось отправить сообщение. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUserInfo = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const info = {
      name: formData.get('name')?.trim() || '',
      email: formData.get('email')?.trim() || '',
      phone: formData.get('phone')?.trim() || '',
    };
    setUserInfo(info);
    localStorage.setItem('chat_user_info', JSON.stringify(info));
    setShowUserInfoForm(false);
  };

  // Кнопка чата (всегда видна, когда чат закрыт)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Всплывающий текст */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-900 text-white text-sm rounded-lg px-4 py-2 shadow-lg whitespace-nowrap relative">
              Онлайн чат для консультации
              {/* Стрелочка вниз */}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        )}
        <button
          onClick={handleOpenChat}
          className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center group relative"
          aria-label="Открыть чат"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>
      </div>
    );
  }

  // Форма ввода данных пользователя
  if (showUserInfoForm) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Начнем общение</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowUserInfoForm(false);
              setIsOpen(false);
            }}
            className="rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSaveUserInfo} className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 mb-2">
            Если не сможем ответить, позвоним вам или напишем по номеру. Позже можете ввести, но необязательно.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Телефон <span className="text-slate-400 text-xs">(необязательно)</span>
            </label>
            <Input
              name="phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              className="rounded-xl"
              defaultValue={userInfo.phone}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Имя <span className="text-slate-400 text-xs">(необязательно)</span>
            </label>
            <Input
              name="name"
              placeholder="Иван"
              className="rounded-xl"
              defaultValue={userInfo.name}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email <span className="text-slate-400 text-xs">(необязательно)</span>
            </label>
            <Input
              name="email"
              type="email"
              placeholder="example@mail.ru"
              className="rounded-xl"
              defaultValue={userInfo.email}
            />
          </div>
          <Button type="submit" className="w-full rounded-full bg-slate-900 hover:bg-slate-800">
            Сохранить контакты
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={() => setShowUserInfoForm(false)}
            className="w-full rounded-full"
          >
            Продолжить без контактов
          </Button>
        </form>
      </div>
    );
  }

  // Окно чата
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col ${
        isMinimized ? 'h-16' : 'h-[600px] max-h-[80vh]'
      } transition-all duration-300`}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-slate-900" />
          <h3 className="font-semibold text-slate-900">Онлайн-чат</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="rounded-full"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseChat}
            className="rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Сообщения */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="mb-2">Здравствуйте! 👋</p>
                <p className="text-sm">Напишите нам, и мы ответим в ближайшее время.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Форма отправки */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex-shrink-0 space-y-2">
            {!userInfo.phone && (
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                💡 Если не сможем ответить, позвоним вам или напишем по номеру. 
                <button
                  type="button"
                  onClick={() => setShowUserInfoForm(true)}
                  className="text-slate-900 font-medium underline ml-1"
                >
                  Позже можете ввести
                </button>
                , но необязательно.
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1 rounded-xl"
                disabled={isLoading || !chatId}
              />
              <Button
                type="submit"
                disabled={isLoading || !messageText.trim() || !chatId}
                className="rounded-full bg-slate-900 hover:bg-slate-800"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

