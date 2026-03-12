import { MovieService } from '../movieService'
import { Database } from '../../config/database'
import {
  createMockDatabase,
  createMockMovie,
  createMockRating,
} from '../../__tests__/utils/testHelpers'
import { Movie } from '../../types/movie'

describe('MovieService', () => {
  let service: MovieService
  let mockMoviesDb: jest.Mocked<Database>
  let mockRatingsDb: jest.Mocked<Database>

  beforeEach(() => {
    mockMoviesDb = createMockDatabase()
    mockRatingsDb = createMockDatabase()
    service = new MovieService(mockMoviesDb, mockRatingsDb)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllMovies', () => {
    it('should return paginated movies', async () => {
      const mockMovies: Movie[] = [createMockMovie() as Movie]
      const mockCount = { count: 100 }

      mockMoviesDb.query.mockResolvedValue(mockMovies)
      mockMoviesDb.get.mockResolvedValue(mockCount)

      const result = await service.getAllMovies(1)

      expect(result.data).toEqual(mockMovies)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(50)
      expect(result.total).toBe(100)
      expect(result.totalPages).toBe(2)
      expect(mockMoviesDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT movieId, imdbId, title'),
        [50, 0]
      )
    })

    it('should calculate correct offset for page 2', async () => {
      const mockMovies: Movie[] = []
      const mockCount = { count: 100 }

      mockMoviesDb.query.mockResolvedValue(mockMovies)
      mockMoviesDb.get.mockResolvedValue(mockCount)

      await service.getAllMovies(2)

      expect(mockMoviesDb.query).toHaveBeenCalledWith(expect.any(String), [50, 50])
    })
  })

  describe('getMovieById', () => {
    it('should return movie details with rating', async () => {
      const mockMovie = createMockMovie()
      const mockRating = createMockRating()

      mockMoviesDb.get.mockResolvedValue(mockMovie as Movie)
      mockRatingsDb.get.mockResolvedValue(mockRating)

      const result = await service.getMovieById('tt1234567')

      expect(result).toBeDefined()
      expect(result?.imdbId).toBe('tt1234567')
      expect(result?.average_rating).toBe(7.5)
      expect(mockMoviesDb.get).toHaveBeenCalledWith(expect.stringContaining('WHERE imdbId = ?'), [
        'tt1234567',
      ])
      expect(mockRatingsDb.get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE movieId = ?'),
        [1]
      )
    })

    it('should return null if movie not found', async () => {
      mockMoviesDb.get.mockResolvedValue(undefined)

      const result = await service.getMovieById('tt9999999')

      expect(result).toBeNull()
      expect(mockRatingsDb.get).not.toHaveBeenCalled()
    })
  })

  describe('getMoviesByYear', () => {
    it('should return movies filtered by year', async () => {
      const mockMovies: Movie[] = [createMockMovie() as Movie]
      const mockCount = { count: 10 }

      mockMoviesDb.query.mockResolvedValue(mockMovies)
      mockMoviesDb.get.mockResolvedValue(mockCount)

      const result = await service.getMoviesByYear(2020, 1, 'asc')

      expect(result.data).toEqual(mockMovies)
      expect(mockMoviesDb.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE strftime('%Y', releaseDate) = ?"),
        ['2020', 50, 0]
      )
    })

    it('should respect sort order', async () => {
      const mockMovies: Movie[] = []
      const mockCount = { count: 0 }

      mockMoviesDb.query.mockResolvedValue(mockMovies)
      mockMoviesDb.get.mockResolvedValue(mockCount)

      await service.getMoviesByYear(2020, 1, 'desc')

      expect(mockMoviesDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY releaseDate DESC'),
        expect.any(Array)
      )
    })
  })

  describe('getMoviesByGenre', () => {
    it('should return movies filtered by genre', async () => {
      const mockMovies: Movie[] = [createMockMovie() as Movie]
      const mockCount = { count: 5 }

      mockMoviesDb.query.mockResolvedValue(mockMovies)
      mockMoviesDb.get.mockResolvedValue(mockCount)

      const result = await service.getMoviesByGenre('Action', 1)

      expect(result.data).toEqual(mockMovies)
      expect(mockMoviesDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE genres LIKE ?'),
        ['%Action%', 50, 0]
      )
    })
  })
})
