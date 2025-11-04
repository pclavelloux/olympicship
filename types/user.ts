export interface Profile {
  id: string
  github_username: string
  github_id: string
  display_username?: string
  website_url?: string // First URL in the list (main website)
  other_urls?: string[] // Array of all URLs (main is first, rest are others)
  avatar_url?: string
  github_token?: string
  total_contributions: number
  contributions_data?: ContributionData
  last_updated: string
  created_at: string
}

// Alias pour compatibilité
export type User = Profile

export interface ContributionData {
  [date: string]: number // date in format "YYYY-MM-DD" => number of contributions
}

export interface GitHubContribution {
  date: string
  count: number
  level: number // 0-4
}

export interface ContributionWeek {
  days: GitHubContribution[]
}

