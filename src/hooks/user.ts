import type { User } from '@/server/services/user'
import { createContext, useContext } from 'react'

const Context = createContext<User | null>(null)

export const UserContextProvider = Context.Provider

export const useUser = () => {
  const user = useContext(Context)

  function getPermission(permission: string) {}
  function getDefaultOrgPermission(permission: string) {}

  return {
    user,
    getPermission,
    getDefaultOrgPermission,
  }
}
