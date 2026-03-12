import { Genre } from '../types/movie'

export function formatBudget(budget: number | null | undefined): string {
  if (budget === null || budget === undefined) {
    return '$0'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(budget)
}

export function formatBudgetForResponse(budget: number | null | undefined): string {
  return formatBudget(budget)
}

export function parseGenres(genresString: string | null | undefined): Genre[] {
  if (!genresString) {
    return []
  }

  try {
    const parsed = JSON.parse(genresString)
    if (Array.isArray(parsed)) {
      return parsed as Genre[]
    }
    return []
  } catch {
    // If parsing fails, return empty array
    // This handles cases where genres might be malformed JSON
    return []
  }
}
