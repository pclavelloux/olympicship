'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { RiTwitterXFill } from 'react-icons/ri'

export default function Footer() {
  return (
    <footer className="bg-gh-secondary border-t border-gh-tertiary mt-auto">
      <div className="container mx-auto px-4 py-6 max-w-[1920px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-base-content/70 text-sm">
            Made with ❤️ by <Link href="https://paulinecx.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Pauline</Link>
          </div>
          
          <div className="flex items-center gap-6">
            {/* X (Twitter) Link */}
            <a
              href="https://x.com/Pauline_Cx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors"
              aria-label="X de Pauline"
            >
              <RiTwitterXFill className="w-5 h-5" />
            </a>
            
            {/* Newsletter Link */}
            <a
              href="https://paulinecx.beehiiv.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-base-content/70 hover:text-base-content transition-colors"
              aria-label="Newsletter de Pauline"
            >
              <Mail className="w-5 h-5" />
              <span className="hidden sm:inline">Newsletter</span>
            </a>
            
            {/* Terms of Services Link */}
            <Link
              href="/terms"
              className="text-base-content/70 hover:text-base-content transition-colors text-sm"
            >
              Terms of Services
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

