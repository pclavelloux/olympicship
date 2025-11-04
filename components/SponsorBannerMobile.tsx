'use client'

import { useState, useEffect, useRef } from 'react'
import { Megaphone } from 'lucide-react'

interface Sponsor {
  id: string
  email: string
  company_name: string | null
  description: string | null
  website_url: string | null
  status: string
}

// Helper function to get favicon URL from website URL
const getFaviconUrl = (websiteUrl: string | null): string => {
  if (!websiteUrl) return ''
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return ''
  }
}

// Helper function to shuffle array randomly
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function SponsorBannerMobile() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isScrollingHorizontallyRef = useRef(false)

  useEffect(() => {
    fetchSponsors()
  }, [])

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/sponsors')
      if (response.ok) {
        const data = await response.json() as { sponsors?: Sponsor[] }
        // Shuffle sponsors randomly
        const shuffled = shuffleArray(data.sponsors || [])
        setSponsors(shuffled)
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

  // Duplicate items for infinite scroll
  const allItems = [
    ...sponsors.map(sponsor => ({ type: 'sponsor' as const, data: sponsor })),
    { type: 'empty' as const, data: null }
  ]
  const duplicatedItems = [...allItems, ...allItems]

  // Calculate card width + gap for proper animation
  const cardWidth = 200 // w-[200px]
  const gap = 16 // gap-4 = 1rem = 16px
  const singleSetWidth = allItems.length * (cardWidth + gap)
  const totalWidth = singleSetWidth * 2

  // Setup CSS animation with pause/resume
  // This useEffect must be called before any early returns to maintain Hook order
  useEffect(() => {
    if (!containerRef.current || loading || sponsors.length === 0) return

    const container = containerRef.current
    const animationDuration = 30 // seconds

    // Create or update CSS animation
    const styleId = 'sponsor-banner-animation'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    const keyframes = `
      @keyframes sponsor-banner-scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-${singleSetWidth}px);
        }
      }
    `

    styleElement.textContent = keyframes

    // Apply animation styles with GPU acceleration
    container.style.animation = isPaused 
      ? 'none' 
      : `sponsor-banner-scroll ${animationDuration}s linear infinite`
    container.style.willChange = 'transform'
    container.style.transform = 'translateZ(0)' // Force GPU acceleration
    container.style.backfaceVisibility = 'hidden' // Optimize rendering
    container.style.perspective = '1000px' // Enable 3D transforms

    // Cleanup
    return () => {
      if (container) {
        container.style.animation = 'none'
        container.style.willChange = 'auto'
      }
    }
  }, [isPaused, singleSetWidth, loading, sponsors.length])

  // Early returns after all Hooks have been called
  if (loading) {
    return null
  }

  // Si pas de sponsors, ne rien afficher
  if (sponsors.length === 0) {
    return null
  }

  // Render sponsor card
  const renderSponsorCard = (sponsor: Sponsor, key: string) => {
    const faviconUrl = getFaviconUrl(sponsor.website_url)
    const initials = sponsor.company_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

    const content = (
      <div className="card bg-gh-secondary hover:shadow-lg transition-all duration-300 border border-base-300 rounded-gh shrink-0 w-[200px]">
        <div className="card-body p-3">
          <div className="flex items-start gap-2">
            <div className="avatar placeholder shrink-0">
              <div className="rounded-gh w-8 h-8 flex items-center justify-center overflow-hidden bg-base-200">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt={sponsor.company_name || 'Sponsor'}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full rounded-gh flex items-center justify-center text-xs font-bold bg-primary/20 text-primary"
                  style={{ display: faviconUrl ? 'none' : 'flex' }}
                >
                  {initials}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base-content text-xs mb-1 line-clamp-1">
                {sponsor.company_name || 'Sponsor'}
              </h3>
              {sponsor.description && (
                <p className="text-xs text-base-content/70 line-clamp-2 leading-tight">
                  {sponsor.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )

    if (sponsor.website_url) {
      return (
        <a
          key={key}
          href={sponsor.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      )
    }

    return (
      <div key={key}>
        {content}
      </div>
    )
  }

  // Render empty slot
  const renderEmptySlot = (key: string) => (
    <div
      key={key}
      onClick={handleSponsorClick}
      className="card bg-gh-secondary border-2 border-dashed border-base-300 hover:border-primary transition-all duration-300 cursor-pointer group rounded-gh shrink-0 w-[200px]"
    >
      <div className="card-body p-3">
        <div className="flex items-start gap-2">
          <div className="avatar placeholder shrink-0">
            <div className="bg-base-200 text-base-content rounded-gh w-8 h-8 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors text-xs mb-1">
              {checkoutLoading ? 'Loading...' : 'Promote here!'}
            </h3>
            <p className="text-xs text-base-content/60 line-clamp-2">
              {checkoutLoading ? 'Redirecting...' : 'Get visibility'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle if touching the banner content directly
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isScrollingHorizontallyRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
    
    // If vertical scroll is more significant, don't interfere - let page scroll
    if (deltaY > deltaX && deltaY > 15) {
      // Vertical scroll detected - don't interfere, let the page scroll
      isScrollingHorizontallyRef.current = false
      touchStartRef.current = null // Reset to allow page scrolling
      return
    }
    
    // If horizontal scroll is more significant, allow it and pause animation
    if (deltaX > deltaY && deltaX > 15) {
      isScrollingHorizontallyRef.current = true
      setIsPaused(true)
    }
  }

  const handleTouchEnd = () => {
    if (isScrollingHorizontallyRef.current) {
      // Only pause if we were scrolling horizontally
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsPaused(false)
      }, 1500)
    }
    touchStartRef.current = null
    isScrollingHorizontallyRef.current = false
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 bg-base-200 border-t border-base-300 md:hidden overflow-hidden"
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling to pass through to page
        pointerEvents: 'auto',
        // Ensure the banner doesn't block page scrolling
        overscrollBehavior: 'none',
      }}
    >
      <div
        ref={containerRef}
        className="sponsor-banner-content flex gap-4 px-4 py-3"
        style={{ 
          width: totalWidth,
          willChange: 'transform',
          transform: 'translateZ(0)', // Force GPU acceleration
          backfaceVisibility: 'hidden', // Optimize rendering
          touchAction: 'pan-x pinch-zoom', // Only allow horizontal panning on the banner itself
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current)
          }
          scrollTimeoutRef.current = setTimeout(() => {
            setIsPaused(false)
          }, 1500)
        }}
      >
        {duplicatedItems.map((item, index) => {
          if (item.type === 'sponsor') {
            return renderSponsorCard(item.data as Sponsor, `sponsor-${index}`)
          } else {
            return renderEmptySlot(`empty-${index}`)
          }
        })}
      </div>
    </div>
  )
}

