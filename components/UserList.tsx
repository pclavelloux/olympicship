'use client'

import { User } from '@/types/user'
import UserCard from './UserCard'

interface UserListProps {
  users: User[]
  currentUserGithubUsername?: string
  onUserUpdate?: (userId: string, data: { display_username: string; website_url: string; open_to_work?: boolean; open_for_partner?: boolean; languages?: string[] }) => void
  onRefresh?: () => void
}

export default function UserList({ users, currentUserGithubUsername, onUserUpdate, onRefresh }: UserListProps) {
  return (
    <div className="space-y-6">
      {users.map((user, index) => (
        <UserCard
          key={user.id}
          user={user}
          rank={index + 1}
          isCurrentUser={user.github_username === currentUserGithubUsername}
          onUpdate={
            onUserUpdate
              ? (data) => onUserUpdate(user.id, data)
              : undefined
          }
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}

