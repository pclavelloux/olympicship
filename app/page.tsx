'use client'

import { useEffect, useMemo, useState } from 'react'
import { User } from '@/types/user'
import LeaderboardTable from '@/components/LeaderboardTable'
import Header from '@/components/ui/header'
import SponsorPanel from '@/components/SponsorPanel'
import SponsorBanner from '@/components/SponsorBanner'
import { User as UserIcon } from 'lucide-react'
import GitHubConnectButton from '@/components/GitHubConnectButton'

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('success')) {
      // Remove query params from URL
      window.history.replaceState({}, '', '/')
      // Wait a bit for the profile to be created, then fetch current user
      // Retry multiple times in case the profile takes time to be created
      const retryFetchUser = async (attempts = 5) => {
        for (let i = 0; i < attempts; i++) {
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)))
          try {
            const response = await fetch('/api/me')
            if (response.ok) {
              const data = await response.json()
              if (data.profile) {
                setCurrentUser(data.profile)
                fetchUsers() // Refresh users list
                return // Success, stop retrying
              }
            }
          } catch (error) {
            console.error('Error fetching user:', error)
          }
        }
        // If we get here, still refresh users list
        fetchUsers()
      }
      retryFetchUser()
    }
    if (params.get('error')) {
      setErrorMessage(params.get('error') || 'An error occurred')
      window.history.replaceState({}, '', '/')
    }

    fetchUsers()
    fetchCurrentUser()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      setErrorMessage('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me')
      if (!response.ok) {
        throw new Error('Failed to fetch current user')
      }
      const data = await response.json()
      setCurrentUser(data.profile)
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    window.location.reload()
  }

  // Sample sponsors data - Replace with real data from your database/API
  const leftSponsors = [
    {
      id: '1',
      name: 'Capgo',
      description: 'Instant updates for Capacitor app. Ship updates, fixes, changes, and features within minutes.',
      backgroundColor: '#dbeafe',
      iconColor: '#1e40af',
    },
    {
      id: '2',
      name: 'Capgo',
      description: 'Instant updates for Capacitor app. Ship updates, fixes, changes, and features within minutes.',
      backgroundColor: '#dbeafe',
      iconColor: '#1e40af',
    },
    null, // Empty ad spot
  ]

  const rightSponsors = [
    {
      id: '3',
      name: 'Capgo',
      description: 'Instant updates for Capacitor app. Ship updates, fixes, changes, and features within minutes.',
      backgroundColor: '#dbeafe',
      iconColor: '#1e40af',
    },
    {
      id: '4',
      name: 'Capgo',
      description: 'Instant updates for Capacitor app. Ship updates, fixes, changes, and features within minutes.',
      backgroundColor: '#dbeafe',
      iconColor: '#1e40af',
    },
    null, // Empty ad spot
  ]

  // Combine all sponsors (not used in current layout)
  const allSponsorsForBanner = [...leftSponsors, ...rightSponsors]

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const username = (u.display_username || u.github_username || '').toLowerCase()
      const login = (u.github_username || '').toLowerCase()
      return username.includes(q) || login.includes(q)
    })
  }, [users, searchQuery])

  return (
    <main className="min-h-screen bg-base-300">
      {/* Header */}
      <Header 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
      />

      {/* Messages */}
      {successMessage && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-success">
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-error">
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-[1920px]">
       
        {/* Grid Layout: responsive - 1 column on mobile, 6 columns (1-4-1) on desktop */}
        <div className="grid grid-cols-6 gap-4 gap-8 py-8">
          {/* Left Sponsor Panel - Desktop only - 1 column */}
          <div className="col-span-1 min-w-0 bg-gh-tertiary">
            <SponsorPanel sponsors={leftSponsors} />
          </div>

          {/* Main Content - Full width on mobile, 4 columns on desktop */}
          <div className="col-span-4 ">
            {/* Hero */}
            <div className="text-center mb-8">
              <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 tracking-tight">
                <span className=" bg-clip-text text-gh-white">
                  Verified GitHub contributions
                </span>
              </h1>
              <p className="text-base-content/70 text-base lg:text-lg mb-6">
                Top developers ranked by total contributions
              </p>

              <div className="flex justify-center">
                <GitHubConnectButton label="Add my GitHub" />
              </div>
            </div>

            {/* Content Card */}
            <div className="card bg-base-100 shadow-xl rounded-gh border border-base-200">
              <div className="card-body p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-24 px-4">
                    <UserIcon className="mx-auto h-16 w-16 text-base-content/30 mb-4" />
                    <h3 className="text-xl font-semibold text-base-content mb-2">
                      No contributors yet
                    </h3>
                    <p className="text-base-content/60">
                      Be the first to add your GitHub account!
                    </p>
                  </div>
                ) : (
                  <LeaderboardTable
                    users={filteredUsers}
                    currentUserGithubUsername={currentUser?.github_username}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Sponsor Panel - Desktop only - 1 column */}
          <div className=" col-span-1 bg-gh-tertiary">
            <SponsorPanel sponsors={rightSponsors} />
          </div>
        </div>
      </div>
    </main>
  )
}
