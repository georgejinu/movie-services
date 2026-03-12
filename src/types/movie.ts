export interface Genre {
  id: number
  name: string
}

export interface Movie {
  movieId: number
  imdbId: string
  title: string
  genres: string
  releaseDate: string
  budget: number
  overview?: string
  runtime?: number
  language?: string
  revenue?: number
  status?: string
  productionCompanies?: string
}

export interface MovieWithRating extends Movie {
  average_rating?: number
}

export interface ProductionCompany {
  id: number
  name: string
}

export interface MovieDetails extends MovieWithRating {
  production_companies?: ProductionCompany[]
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface MovieListQuery {
  page?: number
  sortOrder?: 'asc' | 'desc'
}
