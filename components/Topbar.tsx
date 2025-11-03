'use client'

import {
  Search,
  Settings,
  LogOut,
  User as UserIcon,
  Users,
  Plus,
  Bell,
  GitBranch,
  Inbox,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from '@/types/user'

interface TopbarProps {
  currentUser: User | null
  onSignOut: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}

export default function Topbar({
  currentUser,
  onSignOut,
  searchQuery,
  onSearchChange
}: TopbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onSignOut()
  }

  // Focus sur la recherche avec la touche /
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isSlash = e.key === '/'
      const typingInInput =
        (e.target as HTMLElement)?.tagName === 'INPUT' ||
        (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
        (e.target as HTMLElement)?.getAttribute('contenteditable') === 'true'
      if (isSlash && !typingInInput) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="bg-base-100 border-b border-base-200 sticky top-0 z-50">
      <div className="h-14 px-3 sm:px-4 flex items-center gap-3">
        {/* (Optionnel) Logo à gauche */}
        <Link href="/" className="hidden sm:inline-flex items-center font-semibold">
          <span className="text-base-content/90">YourApp</span>
        </Link>

        {/* Search centré (prend l'espace) */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60">
              <Search className="w-5 h-5" />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Type / to search"
              className="input input-bordered w-full pl-10 bg-base-200 border-base-300 rounded-gh"
            />
          </div>
        </div>

        {/* Groupe de boutons à droite */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Exemples de menus à droite */}
          <div className="dropdown dropdown-end">
            <button className="btn btn-ghost btn-circle rounded-gh">
              <Users className="w-5 h-5" />
              <ChevronDown className="w-4 h-4 ml-1 hidden sm:inline-block" />
            </button>
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-gh w-56 border border-base-300">
              <li><a>Team Switch</a></li>
              <li><a>Invite members</a></li>
            </ul>
          </div>

          <div className="dropdown dropdown-end">
            <button className="btn btn-ghost btn-circle rounded-gh">
              <Plus className="w-5 h-5" />
              <ChevronDown className="w-4 h-4 ml-1 hidden sm:inline-block" />
            </button>
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-gh w-56 border border-base-300">
              <li><a>New project</a></li>
              <li><a>New issue</a></li>
            </ul>
          </div>

          <button className="btn btn-ghost btn-circle rounded-gh">
            <Bell className="w-5 h-5" />
          </button>

          <button className="btn btn-ghost btn-circle rounded-gh">
            <GitBranch className="w-5 h-5" />
          </button>

          <button className="btn btn-ghost btn-circle rounded-gh">
            <Inbox className="w-5 h-5" />
          </button>

          {/* Menu utilisateur */}
          <div className="dropdown dropdown-end">
            <button className="btn btn-ghost btn-circle rounded-gh">
              <div className="avatar placeholder">
                <div className="bg-base-300 text-base-content w-8 rounded-full">
                  <span className="text-xs">
                    {currentUser?.display_username?.[0]?.toUpperCase() || 
                     currentUser?.github_username?.[0]?.toUpperCase() || 
                     '+'}
                  </span>
                </div>
              </div>
            </button>
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-gh w-56 border border-base-300">
              {currentUser ? (
                <>
                  <li>
                    <Link href="/profile" className="flex items-center gap-2 text-gh-white underline">
                      <UserIcon className="w-4 h-4" />
                      <span>Edit my profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="flex items-center gap-2 text-gh-white">
                      <Settings className="w-4 h-4" />
                      <span>Settingfdfs</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 bg-base-200 hover:bg-base-300 text-base-content rounded-gh"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/login" className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span>Sign in</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}