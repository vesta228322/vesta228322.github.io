/**
 * SEO и Метрика Менеджер
 */

export const updateSEO = (to) => {
  // 1. Яндекс Метрика
  if (typeof window.ym !== 'undefined') {
    window.ym(107061804, 'hit', to.fullPath);
  }

  // 2. Динамический заголовок (Title)
  let title = 'KinoFlow — смотри фильмы онлайн';
  
  if (to.path === '/top') {
    title = 'KinoFlow — Популярные фильмы и сериалы';
  } else if (to.path.includes('/movie/')) {
    title = 'KinoFlow — Просмотр фильма';
  } else if (to.path === '/profile') {
    title = 'KinoFlow — Профиль пользователя';
  } else if (to.path === '/search') {
    title = 'KinoFlow — Поиск фильмов';
  }

  document.title = title;
};
