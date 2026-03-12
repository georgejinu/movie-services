import { Request, Response } from 'express'
import { MovieService } from '../services/movieService'
import {
  toMovieListResponse,
  toMovieDetailsResponse,
  MovieListResponse,
  MovieDetailsResponse,
} from '../types/responses'
import { PaginatedResponse } from '../types/movie'
import { logger } from '../utils/logger'

export class MovieController {
  private controllerLogger = logger('movieController')

  constructor(private movieService: MovieService) {}
  async getAllMovies(req: Request, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string, 10) || 1
    try {
      this.controllerLogger.debug('Fetching all movies', { page })
      const result = await this.movieService.getAllMovies(page)

      // Transform movies to include formatted budget
      const response: PaginatedResponse<MovieListResponse> = {
        ...result,
        data: result.data.map(toMovieListResponse),
      }

      this.controllerLogger.info('Successfully fetched movies', {
        page,
        total: result.total,
        returned: result.data.length,
      })
      res.json(response)
    } catch (error) {
      this.controllerLogger.error('Error fetching movies', { error, page })
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getMovieDetails(req: Request, res: Response): Promise<void> {
    const { imdbId } = req.params
    try {
      this.controllerLogger.debug('Fetching movie details', { imdbId })
      const movie = await this.movieService.getMovieById(imdbId)

      if (!movie) {
        this.controllerLogger.warn('Movie not found', { imdbId })
        res.status(404).json({ error: 'Movie not found' })
        return
      }

      // Transform to response format with formatted budget
      const response: MovieDetailsResponse = toMovieDetailsResponse(movie)
      this.controllerLogger.info('Successfully fetched movie details', {
        imdbId,
        title: movie.title,
      })
      res.json(response)
    } catch (error) {
      this.controllerLogger.error('Error fetching movie details', { error, imdbId })
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getMoviesByYear(req: Request, res: Response): Promise<void> {
    const year = parseInt(req.params.year, 10)
    const page = parseInt(req.query.page as string, 10) || 1
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc'

    try {
      // Basic validation for year - reasonable range check
      if (isNaN(year) || year < 1900 || year > 2100) {
        this.controllerLogger.warn('Invalid year parameter', { year })
        res.status(400).json({ error: 'Invalid year parameter' })
        return
      }

      this.controllerLogger.debug('Fetching movies by year', { year, page, sortOrder })
      const result = await this.movieService.getMoviesByYear(year, page, sortOrder)

      // Transform movies to include formatted budget
      const response: PaginatedResponse<MovieListResponse> = {
        ...result,
        data: result.data.map(toMovieListResponse),
      }

      this.controllerLogger.info('Successfully fetched movies by year', {
        year,
        page,
        sortOrder,
        total: result.total,
        returned: result.data.length,
      })
      res.json(response)
    } catch (error) {
      this.controllerLogger.error('Error fetching movies by year', { error, year, page, sortOrder })
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  async getMoviesByGenre(req: Request, res: Response): Promise<void> {
    const { genre } = req.params
    const page = parseInt(req.query.page as string, 10) || 1

    try {
      if (!genre || genre.trim().length === 0) {
        this.controllerLogger.warn('Genre parameter is required')
        res.status(400).json({ error: 'Genre parameter is required' })
        return
      }

      this.controllerLogger.debug('Fetching movies by genre', { genre, page })
      const result = await this.movieService.getMoviesByGenre(genre, page)

      // Transform movies to include formatted budget
      const response: PaginatedResponse<MovieListResponse> = {
        ...result,
        data: result.data.map(toMovieListResponse),
      }

      this.controllerLogger.info('Successfully fetched movies by genre', {
        genre,
        page,
        total: result.total,
        returned: result.data.length,
      })
      res.json(response)
    } catch (error) {
      this.controllerLogger.error('Error fetching movies by genre', { error, genre, page })
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
