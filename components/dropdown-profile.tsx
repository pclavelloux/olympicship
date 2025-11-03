'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { User } from '@/types/user'
import { createClient } from '@/lib/supabase'
import GitHubConnectButton from './GitHubConnectButton'

export default function DropdownProfile({ 
  align,
  currentUser,
  onSignOut
}: {
  align?: 'left' | 'right'
  currentUser: User | null
  onSignOut: () => void
}) {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onSignOut()
  }

  // If user is not connected, show GitHubConnectButton
  if (!currentUser) {
    return <GitHubConnectButton isAuthenticated={false} />
  }

  // Use default avatar if no user avatar
  const avatarUrl = currentUser?.avatar_url || '/default-avatar.png'
  const displayName = currentUser?.display_username || currentUser?.github_username || 'User'

  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton className="inline-flex justify-center items-center group">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
          {currentUser?.avatar_url ? (
            <Image 
              className="w-8 h-8 rounded-full" 
              src={avatarUrl} 
              width={32} 
              height={32} 
              alt={displayName}
              unoptimized
            />
          ) : (
            <span className="text-xs font-medium text-gray-200">
              {displayName[0]?.toUpperCase() || '+'}
            </span>
          )}
        </div>
        <div className="flex items-center truncate">
          <span className="truncate ml-2 text-sm font-medium text-gray-100 group-hover:text-white">{displayName}</span>
          <svg className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-500" viewBox="0 0 12 12">
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </MenuButton>
      <Transition
        as="div"
        className={`origin-top-right z-10 absolute top-full min-w-[11rem] bg-gray-800 border border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'
          }`}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <>
          <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-700/60">
            <div className="font-medium text-gray-100">{displayName}</div>
            <div className="text-xs text-gray-400 italic">GitHub Contributor</div>
          </div>
          <MenuItems as="ul" className="focus:outline-hidden">
            <MenuItem as="li">
                <Link className="font-medium text-sm flex items-center py-1 px-3 text-gh-white" href="/profile">
                  Settings
                </Link>
            </MenuItem>
            <MenuItem as="li">
              <button onClick={handleSignOut} className="font-medium text-sm flex items-center py-1 px-3 text-gh-white w-full text-left">
                Sign Out
              </button>
            </MenuItem>
          </MenuItems>
        </>
      </Transition>
    </Menu>
  )
}
