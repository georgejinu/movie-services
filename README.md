# Movie Services API

Hey there! This is a movie API service I built to query movie data from SQLite databases. It's a REST API that lets you browse movies, filter by year or genre, and get detailed info about specific films. Pretty straightforward stuff.

## What's Under the Hood

I built this with:
- **Node.js** and **TypeScript** - because type safety is a lifesaver
- **Express.js** - handles all the HTTP stuff
- **SQLite3** - two separate databases for movies and ratings (keeps things simple)
- **Winston** - for logging (way better than console.log)
- **Swagger** - API docs that actually work
- **Jest** - for testing
- **ESLint & Prettier** - keeps the code clean

The app uses rate limiting to prevent abuse, has proper error handling, and logs all requests. Nothing fancy, just solid engineering practices.

## Getting Started

First things first, make sure you have Node.js installed (v16 or higher should work fine). You'll also need npm (comes with Node).

### Step 1: Install Dependencies

Just run the usual:

```bash
npm install
```

This will grab all the packages listed in `package.json`. Takes a minute or two depending on your internet.

### Step 2: Set Up Environment Variables

You'll need a `.env` file in the root directory. Create one with these values:

```env
PORT=3000
NODE_ENV=development
MOVIES_DB_PATH=./db/movies.db
RATINGS_DB_PATH=./db/ratings.db
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

The database paths point to the `db/` folder by default. If your databases are somewhere else, just update those paths. The rate limit settings mean 100 requests per 15 minutes (900000ms) - adjust if you need different limits.

### Step 3: Make Sure Your Databases Exist

The app expects two SQLite databases:
- `db/movies.db` - contains movie information
- `db/ratings.db` - contains ratings data

If they're not there, the app will probably crash on startup. Make sure they exist and have the right schema.

### Step 4: Run It

For development (with auto-reload on file changes):

```bash
npm run dev
```

For production, build first then run:

```bash
npm run build
npm start
```

The server will start on whatever port you set in `.env` (default is 3000). You should see some log messages about database connections and the server starting up.

Once it's running, you can check the health endpoint at `http://localhost:3000/health` to make sure everything's working.

## API Documentation

I set up Swagger docs, so once the server is running, head over to:

```
http://localhost:3000/api-docs
```

This gives you an interactive interface to test all the endpoints. Much easier than trying to remember curl commands.

## What You Can Do

### Health Check
```
GET /health
```
Just tells you if the server is alive. Useful for monitoring.

### List Movies
```
GET /api/movies?page=1
```
Gets you a paginated list of all movies. 50 per page by default. The response includes pagination info so you know how many pages there are.

### Get Movie Details
```
GET /api/movies/:imdbId
```
Pass in an IMDB ID (like `tt1234567`) and get all the details about that movie - description, budget, runtime, ratings, production companies, the works.

### Movies by Year
```
GET /api/movies/year/:year?page=1&sortOrder=asc
```
Filter movies by release year. You can sort ascending or descending. Handy for "what movies came out in 2020?" type queries.

### Movies by Genre
```
GET /api/movies/genre/:genre?page=1
```
Find all movies in a specific genre. The genre matching is case-insensitive, so "action" and "Action" both work.

## Project Structure

Here's how I organized things:

```
src/
├── config/          # Database connections, app config, Swagger setup
├── controllers/     # HTTP request handlers
├── middleware/      # Error handling, rate limiting, logging, validation
├── routes/          # Express route definitions
├── services/        # Business logic (the actual work happens here)
├── types/           # TypeScript interfaces and types
├── utils/           # Helper functions (logging, formatting)
└── index.ts         # Entry point - starts the server
```

I tried to keep a clean separation: controllers handle HTTP stuff, services do the business logic, and the database layer handles data access. Makes it easier to test and maintain.

## Development Stuff

### Running Tests
```bash
npm test
```

Or watch mode if you're actively writing tests:
```bash
npm run test:watch
```

### Code Quality

I've got linting and formatting set up:

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix what can be fixed
npm run format        # Format code with Prettier
npm run check         # Run both format check and lint
```

The codebase uses ESLint with TypeScript rules and Prettier for consistent formatting. Run `npm run check` before committing to make sure everything's clean.

### Building

The TypeScript gets compiled to JavaScript in the `dist/` folder:

```bash
npm run build
```

This runs the TypeScript compiler with all the strict settings enabled. If it builds, you're probably good.

## A Few Notes

- **Rate Limiting**: The API has rate limiting enabled (100 requests per 15 minutes by default). If you hit the limit, you'll get a 429 response. Adjust the limits in `.env` if needed.

- **Error Handling**: All errors go through a centralized error handler. You'll get proper HTTP status codes and error messages in a consistent format.

- **Logging**: Everything gets logged via Winston. Log level is configurable via `LOG_LEVEL` in `.env`. Useful for debugging.

- **Database Connections**: The app connects to both databases on startup and closes them gracefully on shutdown (SIGINT/SIGTERM). No connection leaks here.

- **Pagination**: All list endpoints use pagination. Page size is fixed at 50, but you can navigate through pages.

## Troubleshooting

**Server won't start?** Check that:
- Your databases exist in the `db/` folder
- The port isn't already in use
- All environment variables are set correctly

**Getting database errors?** Make sure the SQLite files are readable and have the right schema. You can use the inspect script to check what's in there:
```bash
npm run inspect-db
```

**Rate limit issues?** The default is 100 requests per 15 minutes. If you're testing a lot, either increase the limit in `.env` or wait it out.

## License

ISC License - do what you want with it.

---

That's about it! If you run into issues or have questions, check the Swagger docs first - they're pretty comprehensive. Happy coding!
