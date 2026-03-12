import { Database } from '../config/database'
import { Movie, MovieDetails, PaginatedResponse, ProductionCompany } from '../types/movie'
import { logger } from '../utils/logger'

// Standard page size for pagination - matches the requirement
const PAGE_SIZE = 50

export class MovieService {
  private serviceLogger = logger('movieService')

  constructor(
    private moviesDb: Database,
    private ratingsDb: Database
  ) {}
  async getAllMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
    // Calculate offset for pagination
    const offset = (page - 1) * PAGE_SIZE

    this.serviceLogger.debug('Querying all movies', { page, offset, pageSize: PAGE_SIZE })
    const movies = await this.moviesDb.query<Movie>(
      `SELECT movieId, imdbId, title, genres, releaseDate, budget
       FROM movies
       ORDER BY releaseDate DESC
       LIMIT ? OFFSET ?`,
      [PAGE_SIZE, offset]
    )

    // Get total count for pagination metadata
    const totalResult = await this.moviesDb.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM movies'
    )
    const total = totalResult?.count || 0

    this.serviceLogger.debug('Movies query completed', {
      page,
      total,
      returned: movies.length,
    })

    return {
      data: movies,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    }
  }

  async getMovieById(imdbId: string): Promise<MovieDetails | null> {
    // Fetch the main movie record
    this.serviceLogger.debug('Fetching movie by imdbId', { imdbId })
    const movie = await this.moviesDb.get<Movie>(
      `SELECT movieId, imdbId, title, genres, releaseDate, budget,
              overview, runtime, language, revenue, status, productionCompanies
       FROM movies
       WHERE imdbId = ?`,
      [imdbId]
    )

    if (!movie) {
      this.serviceLogger.debug('Movie not found', { imdbId })
      return null
    }

    // Get average rating from the ratings database
    // Using the movie.movieId to join with ratings table
    this.serviceLogger.debug('Fetching movie rating', { movieId: movie.movieId })
    const rating = await this.ratingsDb.get<{ average_rating: number }>(
      `SELECT AVG(rating) as average_rating
       FROM ratings
       WHERE movieId = ?`,
      [movie.movieId]
    )

    // Parse productionCompanies if it's a JSON string or comma-separated
    let production_companies: ProductionCompany[] | undefined
    if (movie.productionCompanies) {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(movie.productionCompanies)
        if (Array.isArray(parsed)) {
          production_companies = parsed
        } else if (typeof parsed === 'string') {
          // If it's a comma-separated string, convert to array
          production_companies = parsed.split(',').map((name, index) => ({
            id: index + 1,
            name: name.trim(),
          }))
        }
      } catch {
        // If not JSON, treat as comma-separated string
        production_companies = movie.productionCompanies.split(',').map((name, index) => ({
          id: index + 1,
          name: name.trim(),
        }))
      }
    }

    this.serviceLogger.debug('Movie details retrieved', {
      imdbId,
      hasRating: !!rating?.average_rating,
      hasProductionCompanies: !!production_companies,
    })

    return {
      ...movie,
      average_rating: rating?.average_rating || undefined,
      production_companies:
        production_companies && production_companies.length > 0 ? production_companies : undefined,
    }
  }

  async getMoviesByYear(
    year: number,
    page: number = 1,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<PaginatedResponse<Movie>> {
    const offset = (page - 1) * PAGE_SIZE
    // Convert sort order to SQL syntax - validated to be either 'asc' or 'desc'
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC'

    this.serviceLogger.debug('Querying movies by year', { year, page, sortOrder, offset })

    // Use strftime to extract year from date for filtering
    // Building query with validated sort order (only 'ASC' or 'DESC' possible)
    const query = `SELECT movieId, imdbId, title, genres, releaseDate, budget
       FROM movies
       WHERE strftime('%Y', releaseDate) = ?
       ORDER BY releaseDate ${order}
       LIMIT ? OFFSET ?`

    const movies = await this.moviesDb.query<Movie>(query, [year.toString(), PAGE_SIZE, offset])

    const totalResult = await this.moviesDb.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM movies
       WHERE strftime('%Y', releaseDate) = ?`,
      [year.toString()]
    )
    const total = totalResult?.count || 0

    this.serviceLogger.debug('Movies by year query completed', {
      year,
      page,
      total,
      returned: movies.length,
    })

    return {
      data: movies,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    }
  }

  async getMoviesByGenre(genre: string, page: number = 1): Promise<PaginatedResponse<Movie>> {
    const offset = (page - 1) * PAGE_SIZE

    this.serviceLogger.debug('Querying movies by genre', { genre, page, offset })

    // Using LIKE with wildcards to match genre in the genres string
    // This handles cases where a movie might have multiple genres
    const movies = await this.moviesDb.query<Movie>(
      `SELECT movieId, imdbId, title, genres, releaseDate, budget
       FROM movies
       WHERE genres LIKE ?
       ORDER BY releaseDate DESC
       LIMIT ? OFFSET ?`,
      [`%${genre}%`, PAGE_SIZE, offset]
    )

    const totalResult = await this.moviesDb.get<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM movies
       WHERE genres LIKE ?`,
      [`%${genre}%`]
    )
    const total = totalResult?.count || 0

    this.serviceLogger.debug('Movies by genre query completed', {
      genre,
      page,
      total,
      returned: movies.length,
    })

    return {
      data: movies,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    }
  }
}
