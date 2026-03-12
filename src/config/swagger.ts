import swaggerJsdoc from 'swagger-jsdoc'
import { config } from './config'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Services API',
      version: '1.0.0',
      description: 'A RESTful API service for querying movie data from SQLite databases',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        MovieListResponse: {
          type: 'object',
          properties: {
            imdb_id: {
              type: 'string',
              example: 'tt1234567',
            },
            title: {
              type: 'string',
              example: 'Movie Title',
            },
            genres: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                    example: 28,
                  },
                  name: {
                    type: 'string',
                    example: 'Action',
                  },
                },
              },
            },
            release_date: {
              type: 'string',
              format: 'date',
              example: '2023-01-01',
            },
            budget: {
              type: 'string',
              example: '$50,000,000',
            },
          },
        },
        MovieDetailsResponse: {
          type: 'object',
          properties: {
            imdb_id: {
              type: 'string',
              example: 'tt1234567',
            },
            title: {
              type: 'string',
              example: 'Movie Title',
            },
            description: {
              type: 'string',
              example: 'Movie description...',
            },
            release_date: {
              type: 'string',
              format: 'date',
              example: '2023-01-01',
            },
            budget: {
              type: 'string',
              example: '$50,000,000',
            },
            runtime: {
              type: 'number',
              example: 120,
            },
            average_rating: {
              type: 'number',
              format: 'float',
              example: 8.5,
            },
            genres: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },
            },
            original_language: {
              type: 'string',
              example: 'en',
            },
            production_companies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MovieListResponse',
              },
            },
            page: {
              type: 'number',
              example: 1,
            },
            pageSize: {
              type: 'number',
              example: 50,
            },
            total: {
              type: 'number',
              example: 1000,
            },
            totalPages: {
              type: 'number',
              example: 20,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
