import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_POSITION_KEY = 'shop_scroll_position';
const NAVIGATION_STATE_KEY = 'navigation_from_shop';

export default function ScrollToTop() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname + location.search);

  useEffect(() => {
    const fromShop = sessionStorage.getItem(NAVIGATION_STATE_KEY) === 'true';
    const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    const currentPath = location.pathname + location.search;
    const prevPath = prevPathRef.current;
    
    // Если это переход назад на каталог (из sessionStorage видно, что мы шли с каталога)
    if (location.pathname.includes('/shop') && fromShop && savedScrollPosition) {
      // Небольшая задержка для корректного восстановления скролла
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition, 10),
          behavior: 'instant'
        });
        // Очищаем флаги после восстановления
        sessionStorage.removeItem(NAVIGATION_STATE_KEY);
        sessionStorage.removeItem(SCROLL_POSITION_KEY);
      }, 100);
    } else if (currentPath !== prevPath) {
      // Для всех остальных переходов (включая переход между товарами) скроллим наверх
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    // Обновляем предыдущий путь
    prevPathRef.current = currentPath;
  }, [location.pathname, location.search]);

  return null;
}

// Утилита для сохранения позиции скролла при уходе с каталога
export function saveShopScrollPosition() {
  if (window.location.pathname.includes('/shop')) {
    sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
    sessionStorage.setItem(NAVIGATION_STATE_KEY, 'true');
  }
}

