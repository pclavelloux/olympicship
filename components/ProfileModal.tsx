'use client'

import { useState } from 'react'
import { User } from '@/types/user'
import { Info, Plus, X } from 'lucide-react'

interface ProfileModalProps {
  user: User
  onClose: () => void
  onUpdate: (data: { display_username: string; website_url: string; other_urls: string[] }) => void
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  // All URLs including main (main is first in the list)
  // Initialize: if other_urls exists and has items, use them; otherwise check website_url
  // website_url might be a JSON array string if other_urls column doesn't exist
  const getAllUrls = (): string[] => {
    if (user.other_urls && user.other_urls.length > 0) {
      return user.other_urls
    }
    // Check if website_url is a JSON array (stored when other_urls column doesn't exist)
    if (user.website_url) {
      try {
        const parsed = JSON.parse(user.website_url)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch {
        // Not JSON, treat as single URL
      }
      // If not JSON or not an array, treat as single URL
      return [user.website_url]
    }
    return []
  }
  
  const initialUrls = getAllUrls()
  const initialMainWebsite = initialUrls.length > 0 ? initialUrls[0] : ''
  const initialOtherUrls = initialUrls.length > 1 ? initialUrls.slice(1) : []
  
  const [displayUsername, setDisplayUsername] = useState(user.display_username || '')
  const [mainWebsite, setMainWebsite] = useState(initialMainWebsite)
  const [otherUrls, setOtherUrls] = useState<string[]>(initialOtherUrls)
  const [isLoading, setIsLoading] = useState(false)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)

  const handleAddUrl = () => {
    setOtherUrls([...otherUrls, ''])
  }

  const handleRemoveUrl = (index: number) => {
    setOtherUrls(otherUrls.filter((_, i) => i !== index))
  }

  const handleOtherUrlChange = (index: number, value: string) => {
    const newUrls = [...otherUrls]
    newUrls[index] = value
    setOtherUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Build all URLs array: main website is first, then other URLs
      const allUrls: string[] = []
      if (mainWebsite.trim()) {
        allUrls.push(mainWebsite.trim())
      }
      // Add other URLs (filter out empty ones)
      const filteredOtherUrls = otherUrls.filter(url => url.trim() !== '')
      allUrls.push(...filteredOtherUrls)

      // Main website is the first URL (or null if empty)
      const mainUrl = allUrls.length > 0 ? allUrls[0] : null
      // Other URLs are all URLs (main is first, so allUrls includes main)
      const allUrlsForStorage = allUrls

      const response = await fetch(`/api/users/${user.github_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_username: displayUsername,
          website_url: mainUrl, // Main website is first URL
          other_urls: allUrlsForStorage, // All URLs including main (main is first)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      onUpdate({ 
        display_username: displayUsername, 
        website_url: mainUrl || '', 
        other_urls: allUrlsForStorage 
      })
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Your Profile
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="display_username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Display Username
            </label>
            <input
              type="text"
              id="display_username"
              value={displayUsername}
              onChange={(e) => setDisplayUsername(e.target.value)}
              placeholder={user.github_username}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This will be shown instead of your GitHub username
            </p>
          </div>
          <div className="mb-4">
            <label
              htmlFor="main_website"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Main website
              <div className="relative">
                <Info 
                  className="w-4 h-4 text-gray-400 cursor-help" 
                  onMouseEnter={() => setShowInfoTooltip(true)}
                  onMouseLeave={() => setShowInfoTooltip(false)}
                />
                {showInfoTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                    Your username link will redirect there
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </label>
            <input
              type="url"
              id="main_website"
              value={mainWebsite}
              onChange={(e) => setMainWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Other URLs */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Other URLs
            </label>
            {otherUrls.map((url, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleOtherUrlChange(index, e.target.value)}
                  placeholder="https://other-site.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddUrl}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-300 dark:border-blue-700"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              Add other URL
            </button>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

