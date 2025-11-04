'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types/user'
import LeaderboardTable from '@/components/LeaderboardTable'
import Header from '@/components/ui/header'
import SponsorPanel from '@/components/SponsorPanel'
import SponsorBanner from '@/components/SponsorBanner'
import SponsorBannerMobile from '@/components/SponsorBannerMobile'
import { User as UserIcon } from 'lucide-react'
import GitHubConnectButton from '@/components/GitHubConnectButton'
import confetti from 'canvas-confetti'

export default function Home() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Check for success/error messages in URL
    const params = new URLSearchParams(window.location.search)
    const isFirstTime = params.get('firstTime') === 'true'

    if (params.get('success')) {
      // Remove query params from URL
      window.history.replaceState({}, '', '/')

      // Si c'est une première connexion, afficher les confettis et le toast
      if (isFirstTime) {
        // Lancer les confettis
        const duration = 3000 // 3 secondes
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min
        }

        const interval: NodeJS.Timeout = setInterval(function () {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          })
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          })
        }, 250)

        // Afficher le toast pendant 5 secondes
        setSuccessMessage('Your stats have been added')
        setTimeout(() => {
          setSuccessMessage('')
        }, 5000)
      }

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

  return (
    <main className="min-h-screen bg-base-300 pb-32 md:pb-0">
      {/* Header */}
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Messages */}
      {successMessage && (
        <div className="toast toast-top toast-center z-50">
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
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-[1920px]">

        {/* Grid Layout: responsive - 1 column on mobile, 6 columns (1-4-1) on desktop */}
        <div className="grid grid-cols-6 gap-8 py-8">
          {/* Left Sponsor Panel - Desktop only - 1 column */}
          <div className="hidden md:block col-span-1 min-w-0 bg-gh-tertiary">
            <SponsorPanel side="left" />
          </div>

          {/* Main Content - Full width on mobile, 4 columns on desktop */}
          <div className="col-span-6 md:col-span-4">
            {/* Hero */}
            <div className="text-center md:mb-8 mb-4 ">
              <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 tracking-tight">
                <span className=" bg-clip-text text-gh-white">
                  Who ships the most?
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
                    users={users}
                    currentUserGithubUsername={currentUser?.github_username}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Sponsor Panel - Desktop only - 1 column */}
          <div className="hidden md:block col-span-1 bg-gh-tertiary">
            <SponsorPanel side="right" />
          </div>
        </div>
      </div>

      {/* Mobile Sponsor Banner - Bottom of screen, scrolling */}
      <SponsorBannerMobile />
    </main>
  )
}
