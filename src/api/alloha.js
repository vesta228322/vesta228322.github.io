import axios from 'axios'

const TOKEN = import.meta.env.VITE_ALLOHA_TOKEN || ''
const BASE = 'https://api.alloha.tv'

/**
 * Получить данные плеера Alloha по TMDB ID
 * Возвращает: iframe, translation_iframe, poster, rating_kp, rating_imdb, description и др.
 */
export const getAllohaByTmdb = async (tmdbId) => {
  const { data } = await axios.get(BASE, {
    params: { token: TOKEN, tmdb: tmdbId },
  })
  if (data.status !== 'success') throw new Error('Alloha: фильм не найден')
  return data.data
}

/**
 * Получить данные плеера Alloha по Кинопоиск ID
 */
export const getAllohaByKp = async (kpId) => {
  const { data } = await axios.get(BASE, {
    params: { token: TOKEN, kp: kpId },
  })
  if (data.status !== 'success') throw new Error('Alloha: фильм не найден')
  return data.data
}
