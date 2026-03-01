import axios from "axios";

// TMDB API ключ — вставь свой после регистрации на themoviedb.org
const API_KEY = import.meta.env.VITE_TMDB_KEY || "";
const BASE_URL = "https://api.themoviedb.org/3";
const LANG = "ru-RU";

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: LANG,
  },
});

// Популярные фильмы
export const getPopular = (page = 1) =>
  tmdb.get("/movie/popular", { params: { page } }).then((r) => r.data);

// Топ по рейтингу
export const getTopRated = (page = 1) =>
  tmdb.get("/movie/top_rated", { params: { page } }).then((r) => r.data);

// Сейчас в кино
export const getNowPlaying = () =>
  tmdb.get("/movie/now_playing").then((r) => r.data);

// Поиск фильмов
export const searchMovies = (query, page = 1) =>
  tmdb.get("/search/movie", { params: { query, page } }).then((r) => r.data);

// Поиск сериалов
export const searchTV = (query, page = 1) =>
  tmdb.get("/search/tv", { params: { query, page } }).then((r) => r.data);

// Информация о фильме
export const getMovieDetails = (id) =>
  tmdb
    .get(`/movie/${id}`, {
      params: { append_to_response: "credits,videos,external_ids,similar" },
    })
    .then((r) => r.data);

// Фильмы по жанру
export const getByGenre = (genreId, page = 1) =>
  tmdb
    .get("/discover/movie", {
      params: { with_genres: genreId, sort_by: "popularity.desc", page },
    })
    .then((r) => r.data);

// Список жанров
export const getGenres = () =>
  tmdb.get('/genre/movie/list').then((r) => r.data)

// Случайный популярный фильм
export const getRandomPopular = async () => {
  const page = Math.floor(Math.random() * 10) + 1
  const data = await tmdb.get('/movie/popular', { params: { page } }).then((r) => r.data)
  const movies = data.results.filter((m) => m.poster_path && m.backdrop_path)
  return movies[Math.floor(Math.random() * movies.length)]
}
