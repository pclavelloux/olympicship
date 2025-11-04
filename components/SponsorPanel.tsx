'use client'

import { useState, useEffect } from 'react'
import { Megaphone } from 'lucide-react'

interface Sponsor {
  id: string
  email: string
  company_name: string
  description: string | null
  website_url: string
  status: string
}

interface SponsorPanelProps {
  side?: 'left' | 'right'
}

// Helper function to get favicon URL from website URL
const getFaviconUrl = (websiteUrl: string | null): string => {
  if (!websiteUrl) return ''
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    // Use Google's favicon service for reliable favicon fetching
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ''
  }
}

// Component for individual sponsor card
function SponsorCard({ sponsor, side }: { sponsor: Sponsor; side: 'left' | 'right' }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const faviconUrl = getFaviconUrl(sponsor.website_url)

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="card bg-base-100 hover:shadow-2xl hover:scale-[1.02] relative z-10 hover:!z-[9999] transition-all duration-300 cursor-pointer group border border-base-300 rounded-gh">
          <div className="card-body p-4">
            <div className="flex items-start gap-3">
              <div className="avatar placeholder">
                <div className="rounded-gh w-12 h-12 flex items-center justify-center overflow-hidden bg-base-200">
                  {faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt={sponsor.company_name || 'Sponsor'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to initials if favicon fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full rounded-gh flex items-center justify-center text-lg font-bold bg-primary/20 text-primary"
                    style={{ display: faviconUrl ? 'none' : 'flex' }}
                  >
                    {sponsor.company_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?'}
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors text-sm mb-1">
                  {sponsor.company_name}
                </h3>
                {sponsor.description && (
                  <p className="text-xs text-base-content/70 line-clamp-3 leading-relaxed">
                    {sponsor.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </a>
      
      {/* Tooltip with thumbnail and full description */}
      {showTooltip && sponsor.description && (
        <div
          className={`absolute z-[9999] top-0 w-80 bg-gh-tertiary border border-base-300 rounded-gh shadow-2xl p-4 ${
            side === 'left' ? 'left-full ml-4' : 'right-full mr-4'
          }`}
        >
          <div className="flex items-start gap-3">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt={sponsor.company_name || 'Sponsor'}
                className="w-16 h-16 rounded-gh object-contain bg-base-200 p-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-base-content text-sm mb-2">
                {sponsor.company_name}
              </h4>
              <p className="text-xs text-base-content/80 leading-relaxed whitespace-pre-wrap">
                {sponsor.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SponsorPanel({ side = 'left' }: SponsorPanelProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    fetchSponsors()
  }, [])

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/sponsors')
      if (response.ok) {
        const data = await response.json()
        setSponsors(data.sponsors || [])
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSponsorClick = async () => {
    if (checkoutLoading) return

    setCheckoutLoading(true)

    try {
      const response = await fetch('/api/sponsors/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Get sponsors for this side with alternating pattern (left: even indices, right: odd indices)
  // Left: 0, 2, 4, 6, 8 (indices pairs)
  // Right: 1, 3, 5, 7, 9 (indices impairs)
  const sideSponsors = sponsors.filter((_, index) => {
    if (side === 'left') {
      return index % 2 === 0 // Even indices go to left
    } else {
      return index % 2 === 1 // Odd indices go to right
    }
  }).slice(0, 5) // Limit to 5 sponsors per side
  
  // Show one empty slot only if we have less than 5 sponsors
  const showEmptySlot = sideSponsors.length < 5

  if (loading) {
    return (
      <div className="space-y-4 sticky top-4 min-w-0">
        <div className="card bg-base-100 shadow-lg rounded-gh">
          <div className="card-body p-4">
            <div className="flex items-center justify-center">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sticky top-4 min-w-0 z-0">
      {/* Display all sponsors for this side */}
      {sideSponsors.map((sponsor) => (
        <SponsorCard key={sponsor.id} sponsor={sponsor} side={side} />
      ))}
      
      {/* Show one empty slot if there's room */}
      {showEmptySlot && (
        <div
          onClick={handleSponsorClick}
          className="card bg-base-100 border-2 border-dashed border-base-300 hover:border-primary transition-all duration-300 cursor-pointer group shadow-lg rounded-gh"
        >
          <div className="card-body p-4">
            <div className="flex items-start gap-3">
              <div className="avatar placeholder">
                <div className="bg-base-200 text-base-content rounded-gh w-12 h-12 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-base-content/40 group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors text-sm mb-1">
                  {checkoutLoading ? 'Loading...' : 'Promote your product here!'}
                </h3>
                <p className="text-xs text-base-content/60">
                  {checkoutLoading
                    ? 'Redirecting to checkout...'
                    : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

