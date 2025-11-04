'use client'

import { useState } from 'react'
import { User } from '@/types/user'
import { Info, Plus, X } from 'lucide-react'

interface ProfileModalProps {
  user: User
  onClose: () => void
  onUpdate: (data: { display_username: string; website_url: string; open_to_work?: boolean; open_for_partner?: boolean; languages?: string[] }) => void
}

export default function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  // Parse website_url which can be a single URL or a JSON array of URLs
  const getAllUrls = (): string[] => {
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
  const [openToWork, setOpenToWork] = useState(user.open_to_work || false)
  const [openForPartner, setOpenForPartner] = useState(user.open_for_partner || false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(user.languages || [])
  const [isLoading, setIsLoading] = useState(false)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)

  // Liste des langages/technologies populaires
  const availableLanguages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go',
    'Rust', 'PHP', 'Swift', 'Kotlin', 'Dart', 'SQL', 'HTML/CSS',
    'React', 'Vue.js', 'Angular', 'Node.js', 'Next.js', 'Django', 'Flask',
    'Spring', 'Laravel', 'Rails', '.NET', 'Flutter', 'React Native',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'MongoDB', 'PostgreSQL'
  ]

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

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
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

      // Store all URLs in website_url as JSON array
      const websiteUrlValue = allUrls.length > 1 
        ? JSON.stringify(allUrls) 
        : (allUrls.length === 1 ? allUrls[0] : null)

      const response = await fetch(`/api/users/${user.github_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_username: displayUsername,
          website_url: websiteUrlValue,
          open_to_work: openToWork,
          open_for_partner: openForPartner,
          languages: selectedLanguages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      onUpdate({ 
        display_username: displayUsername, 
        website_url: websiteUrlValue || '',
        open_to_work: openToWork,
        open_for_partner: openForPartner,
        languages: selectedLanguages
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

            {/* Open to Work */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Open to Work
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Show recruiters you're available
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenToWork(!openToWork)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    openToWork ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  disabled={isLoading}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      openToWork ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Languages Selection */}
              {openToWork && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skills & Technologies
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                    {availableLanguages.map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => toggleLanguage(language)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          selectedLanguages.includes(language)
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        disabled={isLoading}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                  {selectedLanguages.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedLanguages.length} skill{selectedLanguages.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}

              {/* Open for Business Partner */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Open for Business Partner
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Looking for a co-founder
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenForPartner(!openForPartner)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    openForPartner ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  disabled={isLoading}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      openForPartner ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          <div className="flex gap-3 mt-4">
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

