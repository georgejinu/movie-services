import { moviesDb, ratingsDb } from '../config/database'

async function inspectDatabases(): Promise<void> {
  try {
    await moviesDb.connect()
    await ratingsDb.connect()

    console.log('=== Movies Database ===')
    const moviesTables = await moviesDb.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'"
    )
    console.log(
      'Tables:',
      moviesTables.map((t) => t.name)
    )

    for (const table of moviesTables) {
      const schema = await moviesDb.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
        [table.name]
      )
      console.log(`\nSchema for ${table.name}:`)
      console.log(schema[0]?.sql || 'No schema found')
    }

    console.log('\n=== Ratings Database ===')
    const ratingsTables = await ratingsDb.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table'"
    )
    console.log(
      'Tables:',
      ratingsTables.map((t) => t.name)
    )

    for (const table of ratingsTables) {
      const schema = await ratingsDb.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
        [table.name]
      )
      console.log(`\nSchema for ${table.name}:`)
      console.log(schema[0]?.sql || 'No schema found')
    }

    await moviesDb.close()
    await ratingsDb.close()
  } catch (error) {
    console.error('Error inspecting databases:', error)
    process.exit(1)
  }
}

inspectDatabases()
