'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppProvider } from '@/app/app-provider'
import { User } from '@/types/user'

import DropdownProfile from '@/components/dropdown-profile'

export default function Header({
  variant = 'default',
  currentUser,
  onSignOut,
}: {
  variant?: 'default' | 'v2' | 'v3'
  currentUser: User | null
  onSignOut: () => void
}) {

  const { sidebarOpen, setSidebarOpen } = useAppProvider()
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false)

  return (
    <header className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-gh-primary/90 before:-z-10 z-30 `}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${variant === 'v2' || variant === 'v3' ? '' : 'lg:border-b border-gray-200 dark:border-gray-700/60'}`}>

          {/* Header: Left side */}
          <div className="flex items-center space-x-3">
            {/* Hamburger button */}
            <button
              className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => { setSidebarOpen(!sidebarOpen) }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
            {/* Logo */}
            <Link href="/" className="hover:opacity-80 transition-opacity ">
              <img
                src="/os.png"
                alt="Logo"
                width={65}
                height={65}
                className="object-contain"
              />
            </Link>
            {/*  Divider */}
            <hr className="w-px h-8 bg-gh-primary border-none" />
            {/* Navigation Links */}
            {/* <nav className="hidden md:flex items-center space-x-4 ml-4">
              <Link
                href="/stats"
                className="text-base-content/70 hover:text-base-content transition-colors font-medium"
              >
                Weekly stats
              </Link>
            </nav> */}
          </div>

          {/* Header: Right side */}
          <div className="flex items-center">
            <DropdownProfile align="right" currentUser={currentUser} onSignOut={onSignOut} />
          </div>

        </div>
      </div>
    </header>
  )
}
