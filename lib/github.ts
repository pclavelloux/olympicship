export interface GitHubUserData {
  username: string
  id: string
  avatar_url: string
  contributions: Record<string, number>
  totalContributions: number
}

export async function fetchGitHubContributions(
  username: string,
  token: string
): Promise<Record<string, number>> {
  // Calculer les dates pour la dernière année
  const to = new Date()
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)

  // Formater les dates au format ISO 8601 pour GraphQL
  const fromISO = from.toISOString()
  const toISO = to.toISOString()

  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          login: username,
          from: fromISO,
          to: toISO,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error response:', errorText)
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      console.error('GitHub GraphQL errors:', data.errors)
      throw new Error(`GitHub GraphQL error: ${JSON.stringify(data.errors)}`)
    }

    if (!data.data?.user?.contributionsCollection?.contributionCalendar) {
      throw new Error('Invalid response structure from GitHub API')
    }

    const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks
    const contributions: Record<string, number> = {}

    weeks.forEach((week: any) => {
      if (week.contributionDays) {
        week.contributionDays.forEach((day: any) => {
          if (day.date && typeof day.contributionCount === 'number') {
            contributions[day.date] = day.contributionCount
          }
        })
      }
    })

    return contributions
  } catch (error) {
    console.error('Error fetching GitHub contributions:', error)
    throw error
  }
}

export async function fetchGitHubUser(token: string): Promise<{
  username: string
  id: string
  avatar_url: string
}> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      username: data.login,
      id: data.id.toString(),
      avatar_url: data.avatar_url,
    }
  } catch (error) {
    console.error('Error fetching GitHub user:', error)
    throw error
  }
}

