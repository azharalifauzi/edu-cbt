import { useUser } from '@/hooks/user'
import React, { useState } from 'react'
import Link from '@/components/link'
import { AvatarImage, Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { client } from '@/utils/fetcher'
import { cn, navigate } from '@/utils'
import AccountSettings from './account-settings'

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser()
  const [isOpen, setOpen] = useState(false)

  return (
    <>
      <AccountSettings
        key={`account-${isOpen}`}
        isOpen={isOpen}
        onClose={() => setOpen(false)}
      />
      <main>
        <nav className="flex items-center justify-between px-10 h-20 top-0 left-0 right-0">
          <Link to="/admin" className="text-2xl font-semibold block">
            EduCBT
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <button>
                <Avatar>
                  <AvatarImage
                    className="object-cover object-center"
                    src={user?.image ?? undefined}
                  />
                  <AvatarFallback>{user?.name[0]}</AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              className="px-0 py-4 w-52"
            >
              <div className="px-4">
                <div className="line-clamp-1">{user?.name}</div>
                <div className="text-sm text-gray-400 line-clamp-1">
                  {user?.email}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 px-4">
                <button
                  className="mb-2 block w-full text-left"
                  onClick={() => setOpen(true)}
                >
                  Account details
                </button>
                <button
                  className="block w-full text-left"
                  onClick={async () => {
                    await client.api.v1.user.logout.$post()
                    navigate('/')
                  }}
                >
                  Sign out
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </nav>
        <aside className="fixed top-20 bottom-0 left-0 w-60 px-10 py-6">
          <div className="grid gap-3">
            <Link
              className={(isActive) =>
                cn('text-lg hover:underline', {
                  underline: isActive,
                })
              }
              to="/admin/users"
            >
              Users
            </Link>
            <Link
              className={(isActive) =>
                cn('text-lg hover:underline', {
                  underline: isActive,
                })
              }
              to="/admin/organizations"
            >
              Organizations
            </Link>
            <Link
              className={(isActive) =>
                cn('text-lg hover:underline', {
                  underline: isActive,
                })
              }
              to="/admin/roles"
            >
              Roles
            </Link>
            <Link
              className={(isActive) =>
                cn('text-lg hover:underline', {
                  underline: isActive,
                })
              }
              to="/admin/permissions"
            >
              Permissions
            </Link>
            <Link
              className={(isActive) =>
                cn('text-lg hover:underline', {
                  underline: isActive,
                })
              }
              to="/admin/forms"
            >
              Forms
            </Link>
            <Link
              className={(isActive) =>
                cn('text-lg hover:underline', {
                  underline: isActive,
                })
              }
              to="/admin/blogs"
            >
              Blogs
            </Link>
          </div>
        </aside>
        <div className="fixed top-20 left-60 bottom-0 right-0 overflow-auto">
          {children}
        </div>
      </main>
    </>
  )
}

export default AdminLayout
