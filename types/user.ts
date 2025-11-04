export interface Profile {
  id: string
  github_username: string
  github_id: string
  display_username?: string
  website_url?: string // Can be a single URL or JSON array of URLs
  avatar_url?: string
  github_token?: string
  total_contributions: number
  contributions_data?: ContributionData
  open_to_work?: boolean
  open_for_partner?: boolean
  languages?: string[]
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

