import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../Components/ui/button.jsx';
import { Input } from '../Components/ui/input.jsx';
import { Label } from '../Components/ui/label.jsx';
import { Textarea } from '../Components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Components/ui/select.jsx';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Управление настройками
export function SettingsManager() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/settings`);
      if (!response.ok) throw new Error('Ошибка загрузки настроек');
      return response.json();
    },
  });

  // Инициализируем локальные настройки при загрузке данных из API
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (settingsToSave) => {
      const updates = Object.entries(settingsToSave).map(([key, value]) => 
        fetch(`${apiUrl}/api/settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        }).then(res => {
          if (!res.ok) throw new Error(`Ошибка обновления ${key}`);
          return res.json();
        })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setHasChanges(false);
      toast.success('Настройки сохранены');
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка сохранения настроек');
    },
  });

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(localSettings);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const settingFields = [
    { key: 'company_name', label: 'Название компании', type: 'text' },
    { key: 'company_inn', label: 'ИНН', type: 'text' },
    { key: 'phone', label: 'Телефон', type: 'text' },
    { key: 'phone_formatted', label: 'Телефон (для ссылок)', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'address', label: 'Адрес', type: 'textarea', rows: 4 },
    { key: 'working_hours', label: 'Режим работы', type: 'textarea', rows: 3 },
  ];

  if (isLoading) return <div>Загрузка...</div>;

  // Используем localSettings если есть изменения, иначе settings из API
  const displaySettings = hasChanges ? localSettings : settings;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Настройки сайта</h2>
        {hasChanges && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full sm:w-auto">
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
              Отмена
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6">
          {settingFields.map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  value={displaySettings[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-1.5"
                  rows={field.rows || 3}
                />
              ) : (
                <Input
                  type={field.type}
                  value={displaySettings[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="mt-1.5"
                />
              )}
            </div>
          ))}
          {!hasChanges && (
            <p className="text-sm text-slate-500">Измените любое поле для сохранения изменений</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Управление сообщениями
export function MessagesManager() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/messages`);
      if (!response.ok) throw new Error('Ошибка загрузки сообщений');
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await fetch(`${apiUrl}/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Ошибка обновления');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Статус обновлен');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${apiUrl}/api/messages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Ошибка удаления');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Сообщение удалено');
    },
  });

  if (isLoading) return <div>Загрузка...</div>;

  const statusOptions = [
    { value: 'new', label: 'Новое' },
    { value: 'read', label: 'Прочитано' },
    { value: 'replied', label: 'Отвечено' },
    { value: 'archived', label: 'Архив' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Сообщения от пользователей</h2>
      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">Сообщений нет</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Десктопный вид - таблица */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Дата</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Имя</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Телефон</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Сообщение</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(msg.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{msg.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{msg.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{msg.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{msg.message}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={msg.status}
                        onValueChange={(status) => updateStatusMutation.mutate({ id: msg.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Удалить сообщение?')) {
                            deleteMutation.mutate(msg.id);
                          }
                        }}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильный вид - карточки */}
          <div className="md:hidden divide-y">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{msg.name}</p>
                    <p className="text-xs text-slate-500">{new Date(msg.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <Select
                    value={msg.status}
                    onValueChange={(status) => updateStatusMutation.mutate({ id: msg.id, status })}
                  >
                    <SelectTrigger className="w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {msg.phone && <p className="text-sm text-slate-600">📞 {msg.phone}</p>}
                {msg.email && <p className="text-sm text-slate-600">✉️ {msg.email}</p>}
                <p className="text-sm text-slate-700">{msg.message}</p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Удалить сообщение?')) {
                      deleteMutation.mutate(msg.id);
                    }
                  }}
                  className="w-full text-sm"
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

