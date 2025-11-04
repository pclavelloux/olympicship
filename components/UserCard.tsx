'use client'

import { useState } from 'react'
import { User } from '@/types/user'
import ContributionGrid from './ContributionGrid'
import ProfileModal from './ProfileModal'
import GitHubTokenModal from './GitHubTokenModal'
import Image from 'next/image'

interface UserCardProps {
  user: User
  rank: number
  isCurrentUser?: boolean
  onUpdate?: (data: { display_username: string; website_url: string; open_to_work?: boolean; open_for_partner?: boolean; languages?: string[] }) => void
  onRefresh?: () => void
}

export default function UserCard({ user, rank, isCurrentUser, onUpdate, onRefresh }: UserCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)

  const handleUpdate = (data: { display_username: string; website_url: string; open_to_work?: boolean; open_for_partner?: boolean; languages?: string[] }) => {
    if (onUpdate) {
      onUpdate(data)
    }
  }

  // Get main website: first URL from website_url
  // website_url might be a JSON array (multiple URLs) or a single URL string
  const getMainWebsite = (): string | undefined => {
    if (user.website_url) {
      // Check if website_url is a JSON array
      try {
        const parsed = JSON.parse(user.website_url)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0]
        }
      } catch {
        // Not JSON, treat as single URL
      }
      return user.website_url
    }
    return undefined
  }

  const handleTokenSuccess = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border ${
          isCurrentUser
            ? 'border-blue-500 dark:border-blue-400'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <Image
              src={user.avatar_url || '/default-avatar.png'}
              alt={user.display_username || user.github_username}
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                #{rank}
              </span>
              {getMainWebsite() ? (
                <a
                  href={getMainWebsite()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {user.display_username || user.github_username}
                </a>
              ) : (
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user.display_username || user.github_username}
                </span>
              )}
              {isCurrentUser && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  You
                </span>
              )}
            </div>
            <a
              href={`https://github.com/${user.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              @{user.github_username}
            </a>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {user.total_contributions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              contributions
            </div>
            {isCurrentUser && (
              <div className="mt-2 flex flex-col gap-1">
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ✏️ Edit profile
                </button>
                <button
                  onClick={() => setShowTokenModal(true)}
                  className="text-xs text-green-600 dark:text-green-400 hover:underline"
                >
                  🔑 Update contributions (GitHub Token)
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <ContributionGrid
            contributionsData={user.contributions_data || {}}
            username={user.github_username}
          />
        </div>
      </div>

      {showModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdate}
        />
      )}

      {showTokenModal && (
        <GitHubTokenModal
          onClose={() => setShowTokenModal(false)}
          onSuccess={handleTokenSuccess}
        />
      )}
    </>
  )
}

