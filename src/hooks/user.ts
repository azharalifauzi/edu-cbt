import type { User } from '@/server/services/user'
import { createContext, useContext } from 'react'

const Context = createContext<User | null>(null)

export const UserContextProvider = Context.Provider

export const useUser = () => {
  const user = useContext(Context)

  function getPermission(permission: string, orgId: number) {}
  function getDefaultOrgPermission(permissions: string | string[]) {
    const defaultOrgPermission = user?.permissions.find(
      ({ isDefaultOrg }) => isDefaultOrg
    )

    if (!defaultOrgPermission) {
      return false
    }

    const isGranted = defaultOrgPermission.permissions.some(({ key }) => {
      if (typeof permissions === 'string') {
        return key === permissions
      }

      return permissions.includes(key)
    })

    return isGranted
  }

  return {
    user,
    getPermission,
    getDefaultOrgPermission,
  }
}
