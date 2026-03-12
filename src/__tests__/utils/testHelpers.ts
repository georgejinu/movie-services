import { Database } from '../../config/database'

export function createMockDatabase(): jest.Mocked<Database> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue({
      changes: 0,
      lastID: 0,
    } as any),
  } as unknown as jest.Mocked<Database>
}

export function createMockMovie() {
  return {
    movieId: 1,
    imdbId: 'tt1234567',
    title: 'Test Movie',
    genres: '[{"id": 28, "name": "Action"}]',
    releaseDate: '2020-01-01',
    budget: 1000000,
    overview: 'Test overview',
    runtime: 120,
    language: 'en',
    revenue: 5000000,
    status: 'Released',
    productionCompanies: '[{"id": 1, "name": "Test Studio"}]',
  }
}

export function createMockRating() {
  return {
    average_rating: 7.5,
  }
}
