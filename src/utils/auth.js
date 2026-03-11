// Хеш пароля для админки (bcrypt hash для пароля: AdminRais2024!@#)
// В реальном проекте использовать библиотеку bcrypt или аналогичную
const ADMIN_PASSWORD_HASH = '$2a$10$YourHashedPasswordHere1234567890abcdefghijklmnopqrstuvwxyz12';

// Простая авторизация для админки
export const adminAuth = {
  login: async (username, password) => {
    // Логин: Rais
    // Пароль: AdminRais2024!@#$%^&*()
    if (username === 'Rais' && password === 'AdminRais2024!@#$%^&*()') {
      const token = btoa(`${username}:${Date.now()}`);
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', username);
      return { success: true, user: username };
    }
    return { success: false, error: 'Неверный логин или пароль' };
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },
  
  isAuthenticated: () => {
    const token = localStorage.getItem('admin_token');
    return !!token;
  },
  
  getCurrentUser: () => {
    return localStorage.getItem('admin_user');
  }
};



