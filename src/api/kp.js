import axios from 'axios'

const API_KEY = import.meta.env.VITE_KP_KEY || ''
const BASE = 'https://kinopoiskapiunofficial.tech/api'

const kp = axios.create({
  baseURL: BASE,
  headers: { 'X-API-KEY': API_KEY },
})

/**
 * Поиск фильмов по ключевому слову
 * Возвращает массив фильмов в нормализованном формате (совместим с MovieCard)
 */
export const searchKP = async (keyword, page = 1) => {
  const { data } = await kp.get('/v2.1/films/search-by-keyword', {
    params: { keyword, page },
  })
  return {
    results: data.films.map(normalizeKP),
    total: data.films.length,
    pagesCount: data.pagesCount,
  }
}

/**
 * Полная информация о фильме по KP ID
 */
export const getKPFilm = async (id) => {
  const { data } = await kp.get(`/v2.2/films/${id}`)
  return data
}

/**
 * Актёры фильма по KP ID
 */
export const getKPStaff = async (id) => {
  const { data } = await kp.get('/v1/staff', { params: { filmId: id } })
  return data.filter((s) => s.professionKey === 'ACTOR').slice(0, 12)
}

/**
 * Похожие фильмы по KP ID
 */
export const getKPSimilars = async (id) => {
  const { data } = await kp.get(`/v2.2/films/${id}/similars`)
  return (data.items || []).map(normalizeKP)
}

/**
 * Топ популярных фильмов (Топ 250, Популярные сериалы и т.д.)
 */
export const getKPTop = async (page = 1) => {
  const { data } = await kp.get('/v2.2/films/collections', {
    params: { type: 'TOP_POPULAR_ALL', page },
  })
  return (data.items || []).map(normalizeKP)
}

/**
 * Случайный фильм (Год 1990-2023, рейтинг от 6.0)
 */
export const getRandomKPFilm = async () => {
  // Случайный год от 1990 до 2023
  const year = Math.floor(Math.random() * (2023 - 1990 + 1)) + 1990

  // Делаем первый запрос, чтобы узнать сколько страниц есть за этот год
  const { data: initData } = await kp.get('/v2.2/films', {
    params: {
      yearFrom: year,
      yearTo: year,
      ratingFrom: 6,
      ratingTo: 10,
      type: 'FILM',
      page: 1
    },
  })

  // Выбираем случайную страницу (максимум 20, чтобы API не ругался)
  const maxPages = Math.min(initData.totalPages || 1, 20)
  const randomPage = Math.floor(Math.random() * maxPages) + 1

  // Запрашиваем случайную страницу
  const { data } = await kp.get('/v2.2/films', {
    params: {
      yearFrom: year,
      yearTo: year,
      ratingFrom: 6,
      ratingTo: 10,
      type: 'FILM',
      page: randomPage
    },
  })

  const films = (data.items || []).map(normalizeKP).filter(f => f.posterUrl)

  // Если на странице ничего нет с постером, берем с первой
  if (!films.length) {
    const backupFilms = (initData.items || []).map(normalizeKP).filter(f => f.posterUrl)
    return backupFilms[Math.floor(Math.random() * backupFilms.length)]
  }

  return films[Math.floor(Math.random() * films.length)]
}

/**
 * Нормализация KP-объекта фильма → формат совместимый с MovieCard
 */
export const normalizeKP = (film) => ({
  id: film.filmId || film.kinopoiskId,
  title: film.nameRu || film.nameEn || film.nameOriginal || 'Без названия',
  name: film.nameRu || film.nameEn || film.nameOriginal,
  original_title: film.nameEn || film.nameOriginal,
  // KP возвращает полный URL постера — сохраняем его напрямую
  posterUrl: film.posterUrlPreview || film.posterUrl || null,
  poster_path: null, // не использовать TMDB CDN
  vote_average: film.rating ? parseFloat(film.rating) : null,
  release_date: film.year ? `${film.year}-01-01` : null,
  overview: film.description || '',
  // оригинальные данные на случай если нужны
  _kp: film,
})
