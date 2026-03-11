// Local API Client для работы с данными
// Использует localStorage для хранения данных в браузере
// В будущем можно подключить реальный backend API

const createApiClient = () => {
  const client = {
    auth: {
      isAuthenticated: async () => {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem('auth_token');
        return !!token;
      },
      me: async () => {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('auth_user');
        return userStr ? JSON.parse(userStr) : null;
      },
      login: async (email, password) => {
        console.log('Login:', email);
      },
      logout: async () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.reload();
        }
      },
      redirectToLogin: () => {
        console.log('Redirect to login');
      }
    },
    entities: {
      Product: {
        list: async () => {
          // Получение списка товаров через API (только из БД)
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const response = await fetch(`${apiUrl}/api/products`);
            if (response.ok) {
              const products = await response.json();
              // Парсим specs если это строки
              return products.map(p => {
                if (p.specs && typeof p.specs === 'string') {
                  try {
                    p.specs = JSON.parse(p.specs);
                  } catch (e) {
                    p.specs = {};
                  }
                }
                return p;
              });
            }
            throw new Error('API недоступен');
          } catch (error) {
            console.error('Ошибка загрузки товаров из БД:', error);
            return []; // Возвращаем пустой массив - товары только из БД
          }
        },
        filter: async (filters) => {
          const allProducts = await client.entities.Product.list();
          return allProducts.filter(product => {
            return Object.keys(filters).every(key => product[key] === filters[key]);
          });
        },
        get: async (id) => {
          const products = await client.entities.Product.filter({ id });
          return products[0] || null;
        }
      },
      CartItem: {
        list: async () => {
          if (typeof window === 'undefined') return [];
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const sessionId = localStorage.getItem('guest_session');
          if (!sessionId) return [];
          
          try {
            const response = await fetch(`${apiUrl}/api/cart/${sessionId}`);
            if (response.ok) {
              return response.json();
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            const cartStr = localStorage.getItem('cart_items') || '[]';
            return JSON.parse(cartStr);
          }
          return [];
        },
        filter: async (filters) => {
          const allItems = await client.entities.CartItem.list();
          return allItems.filter(item => {
            return Object.keys(filters).every(key => item[key] === filters[key]);
          });
        },
        create: async (data) => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const response = await fetch(`${apiUrl}/api/cart`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            if (response.ok) {
              return response.json();
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            const items = await client.entities.CartItem.list();
            const newItem = {
              id: Date.now().toString(),
              ...data,
              created_date: new Date().toISOString()
            };
            items.push(newItem);
            if (typeof window !== 'undefined') {
              localStorage.setItem('cart_items', JSON.stringify(items));
            }
            return newItem;
          }
        },
        update: async (id, data) => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const response = await fetch(`${apiUrl}/api/cart/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            if (response.ok) {
              return response.json();
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            const items = await client.entities.CartItem.list();
            const index = items.findIndex(item => item.id === id);
            if (index !== -1) {
              items[index] = { ...items[index], ...data };
              if (typeof window !== 'undefined') {
                localStorage.setItem('cart_items', JSON.stringify(items));
              }
              return items[index];
            }
          }
          return null;
        },
        delete: async (id) => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const response = await fetch(`${apiUrl}/api/cart/${id}`, {
              method: 'DELETE'
            });
            if (response.ok) {
              return true;
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            const items = await client.entities.CartItem.list();
            const filtered = items.filter(item => item.id !== id);
            if (typeof window !== 'undefined') {
              localStorage.setItem('cart_items', JSON.stringify(filtered));
            }
            return true;
          }
          return false;
        }
      },
      Order: {
        create: async (data) => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const response = await fetch(`${apiUrl}/api/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            if (response.ok) {
              return response.json();
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            if (typeof window === 'undefined') return null;
            const ordersStr = localStorage.getItem('orders') || '[]';
            const orders = JSON.parse(ordersStr);
            const newOrder = {
              id: Date.now().toString(),
              ...data,
              created_date: new Date().toISOString(),
              status: 'pending'
            };
            orders.push(newOrder);
            localStorage.setItem('orders', JSON.stringify(orders));
            return newOrder;
          }
          return null;
        },
        filter: async (filters) => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${apiUrl}/api/orders?${params}`);
            if (response.ok) {
              return response.json();
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            if (typeof window === 'undefined') return [];
            const ordersStr = localStorage.getItem('orders') || '[]';
            const orders = JSON.parse(ordersStr);
            return orders.filter(order => {
              return Object.keys(filters).every(key => order[key] === filters[key]);
            });
          }
          return [];
        },
        get: async (orderNumber) => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          try {
            const response = await fetch(`${apiUrl}/api/orders/${orderNumber}`);
            if (response.ok) {
              return response.json();
            }
          } catch (error) {
            console.warn('API недоступен, используем localStorage', error);
            const orders = await client.entities.Order.filter({ order_number: orderNumber });
            return orders[0] || null;
          }
          return null;
        }
      }
    }
  };
  return client;
};

export const apiClient = createApiClient();
