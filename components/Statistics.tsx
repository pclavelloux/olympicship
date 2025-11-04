'use client'

import { User } from '@/types/user'

interface StatisticsProps {
  users: User[]
}

export default function Statistics({ users }: StatisticsProps) {
  const totalUsers = users.length
  const totalContributions = users.reduce((sum, user) => sum + user.total_contributions, 0)
  const averageContributions = totalUsers > 0 ? Math.round(totalContributions / totalUsers) : 0
  const topContributor = users[0]

  if (totalUsers === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
     
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Contributions</div>
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          {totalContributions.toLocaleString()}
        </div>
      </div>

     

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top contributors</div>
        <div className="text-xl font-bold text-purple-600 dark:text-purple-400 truncate">
          {topContributor?.display_username || topContributor?.github_username || '-'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          {topContributor?.total_contributions.toLocaleString()} commits
        </div>
      </div>
    </div>
  )
}

