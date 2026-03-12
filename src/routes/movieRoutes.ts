import { Router, Request, Response } from 'express'
import { MovieController } from '../controllers/movieController'
import { validateRequest, validators } from '../middleware/validation'

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: List all movies
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: A paginated list of movies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export function createMovieRoutes(movieController: MovieController): Router {
  const router = Router()

  router.get(
    '/',
    validateRequest({
      query: {
        page: validators.page,
      },
    }),
    (req: Request, res: Response) => movieController.getAllMovies(req, res)
  )

  /**
   * @swagger
   * /api/movies/year/{year}:
   *   get:
   *     summary: Get movies by year
   *     tags: [Movies]
   *     parameters:
   *       - in: path
   *         name: year
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1900
   *           maximum: 2100
   *         description: Release year of the movies
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: asc
   *         description: Sort order (ascending or descending by release date)
   *     responses:
   *       200:
   *         description: A paginated list of movies from the specified year
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedResponse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/year/:year',
    validateRequest({
      params: {
        year: validators.year,
      },
      query: {
        page: validators.page,
        sortOrder: validators.sortOrder,
      },
    }),
    (req: Request, res: Response) => movieController.getMoviesByYear(req, res)
  )

  /**
   * @swagger
   * /api/movies/genre/{genre}:
   *   get:
   *     summary: Get movies by genre
   *     tags: [Movies]
   *     parameters:
   *       - in: path
   *         name: genre
   *         required: true
   *         schema:
   *           type: string
   *         description: Genre name to filter movies
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *     responses:
   *       200:
   *         description: A paginated list of movies matching the genre
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedResponse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/genre/:genre',
    validateRequest({
      params: {
        genre: validators.genre,
      },
      query: {
        page: validators.page,
      },
    }),
    (req: Request, res: Response) => movieController.getMoviesByGenre(req, res)
  )

  /**
   * @swagger
   * /api/movies/{imdbId}:
   *   get:
   *     summary: Get movie details by IMDb ID
   *     tags: [Movies]
   *     parameters:
   *       - in: path
   *         name: imdbId
   *         required: true
   *         schema:
   *           type: string
   *           pattern: '^tt\\d+$'
   *         description: IMDb ID of the movie (e.g., tt1234567)
   *     responses:
   *       200:
   *         description: Detailed information about the movie
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MovieDetailsResponse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       404:
   *         description: Movie not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/:imdbId',
    validateRequest({
      params: {
        imdbId: validators.imdbId,
      },
    }),
    (req: Request, res: Response) => movieController.getMovieDetails(req, res)
  )

  return router
}
