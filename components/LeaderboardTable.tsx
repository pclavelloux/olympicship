'use client'

import { User } from '@/types/user'
import ContributionGrid from './ContributionGrid'
import Image from 'next/image'
import Link from 'next/link'

interface LeaderboardTableProps {
  users: User[]
  currentUserGithubUsername?: string
}

export default function LeaderboardTable({ users, currentUserGithubUsername }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="border border-gray-600/30 rounded-gh overflow-hidden bg-gh-tertiary">
        <table className="w-full border-collapse">
          <thead className="hidden lg:table-header-group">
            <tr className="  ">
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">Rank</th>
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">User</th>
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">Contributions</th>
              <th className="text-base-content/60 font-medium py-4 px-4 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user.id}
                className={`hover:bg-gh-tertiary/50 transition-colors ${
                  user.github_username === currentUserGithubUsername
                    ? 'bg-success/10 ring-2 ring-success/50'
                    : ''
                }`}
              >
              {/* Rank */}
              <td className="align-middle py-4 px-4">
                <div className="flex items-center justify-center lg:justify-start">
                  {index < 3 ? (
                    <span className="text-xl lg:text-2xl font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-base lg:text-lg font-semibold text-base-content/60">
                      #{index + 1}
                    </span>
                  )}
                </div>
              </td>

              {/* User Info */}
              <td className="align-middle py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 lg:w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <Image
                        src={user.avatar_url || '/default-avatar.png'}
                        alt={user.display_username || user.github_username}
                        width={48}
                        height={48}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`https://github.com/${user.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-base-content hover:text-primary transition-colors truncate"
                      >
                        {user.display_username || user.github_username}
                      </Link>
                      {user.github_username === currentUserGithubUsername && (
                        <span className="badge badge-primary badge-sm rounded-gh">
                          You
                        </span>
                      )}
                    </div>
                    <Link
                      href={`https://github.com/${user.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-base-content/60 hover:text-primary transition-colors truncate block"
                    >
                      @{user.github_username}
                    </Link>
                  </div>
                </div>
              </td>

              {/* Contribution Grid */}
              <td className="align-middle py-4 px-4">
                <ContributionGrid
                  contributionsData={user.contributions_data || {}}
                  username={user.github_username}
                  compact={true}
                />
              </td>

              {/* Total Contributions */}
              <td className="align-middle py-4 px-4">
                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-xl lg:text-2xl font-bold text-success">
                      {user.total_contributions.toLocaleString()}
                    </div>
                    <div className="text-xs text-base-content/60 hidden lg:block">
                      contributions
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

