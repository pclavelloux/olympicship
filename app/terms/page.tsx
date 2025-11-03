'use client'

import Link from 'next/link'
import Header from '@/components/ui/header'
import { useEffect, useState } from 'react'
import { User } from '@/types/user'

export default function TermsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.profile)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-base-300 flex flex-col">
      <Header 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
      />

      <div className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <div className="card bg-base-100 shadow-xl rounded-gh border border-base-200">
          <div className="card-body">
            <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
            
            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-base-content/80">
                  By using this service, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
                <p className="text-base-content/80">
                  TrustCode is a service that displays GitHub contributions from users who have 
                  connected their GitHub account and given their consent. The service also allows 
                  sponsors to purchase advertising placements to be displayed on the site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. GitHub Users</h2>
                <p className="text-base-content/80">
                  By connecting your GitHub account, you consent to having your public contributions 
                  displayed on this site. You may withdraw your consent at any time by disconnecting 
                  your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Sponsor Subscriptions</h2>
                <div className="space-y-3 text-base-content/80">
                  <p>
                    Sponsors can purchase advertising placements through a monthly subscription that 
                    automatically renews.
                  </p>
                  <p>
                    <strong>Display Duration:</strong> Advertisements are displayed for one month. 
                    If the subscription is renewed, the display continues for an additional month.
                  </p>
                  <p>
                    <strong>Refunds:</strong> No refunds are available for sponsor subscriptions.
                  </p>
                  <p>
                    <strong>Cancellation:</strong> To cancel your subscription, please contact Pauline 
                    directly. Cancellation will take effect at the end of the current billing period.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Limitation of Liability</h2>
                <p className="text-base-content/80">
                  The service is provided "as is" without warranty of any kind. We do not guarantee 
                  that the service will be uninterrupted, secure, or error-free.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Contact</h2>
                <p className="text-base-content/80">
                  For any questions regarding these Terms of Service or to cancel a sponsor subscription, 
                  please contact Pauline via{' '}
                  <a 
                    href="https://x.com/Pauline_Cx" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:underline"
                  >
                    Twitter
                  </a>
                  {' '}or{' '}
                  <a 
                    href="https://paulinecx.beehiiv.com/subscribe" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:underline"
                  >
                    Newsletter
                  </a>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Changes to Terms</h2>
                <p className="text-base-content/80">
                  We reserve the right to modify these Terms at any time. Changes will be published on 
                  this page and will take effect immediately.
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-base-300">
                <p className="text-sm text-base-content/60">
                  Last updated: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Link 
                href="/"
                className="btn btn-primary"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

