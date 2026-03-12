import { formatBudgetForResponse, parseGenres } from '../utils/formatters'
import { Movie, MovieDetails, ProductionCompany, Genre } from './movie'

export interface MovieListResponse {
  imdb_id: string
  title: string
  genres: Genre[]
  release_date: string
  budget: string
}

export interface MovieDetailsResponse {
  imdb_id: string
  title: string
  description?: string
  release_date: string
  budget: string
  runtime?: number
  average_rating?: number
  genres: Genre[]
  original_language?: string
  production_companies?: ProductionCompany[]
}

export function toMovieListResponse(movie: Movie): MovieListResponse {
  return {
    imdb_id: movie.imdbId,
    title: movie.title,
    genres: parseGenres(movie.genres),
    release_date: movie.releaseDate,
    budget: formatBudgetForResponse(movie.budget),
  }
}

export function toMovieDetailsResponse(movie: MovieDetails): MovieDetailsResponse {
  return {
    imdb_id: movie.imdbId,
    title: movie.title,
    description: movie.overview,
    release_date: movie.releaseDate,
    budget: formatBudgetForResponse(movie.budget),
    runtime: movie.runtime,
    average_rating: movie.average_rating,
    genres: parseGenres(movie.genres),
    original_language: movie.language,
    production_companies: movie.production_companies,
  }
}
