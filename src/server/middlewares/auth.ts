import { SESSION_COOKIE_NAME } from '@/server/constants'
import { db } from '@/server/lib/db'
import { getPermissionByUserId } from '@/server/services/permission'
import dayjs from 'dayjs'
import { type Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { ServerError } from '../lib/error'

interface AuthMiddlewareOptions {
  permission?: string | string[]
}

export const authMiddleware = (options: AuthMiddlewareOptions = {}) =>
  createMiddleware<{
    Variables: {
      userId: number
    }
    Bindings: any
  }>(async (c, next) => {
    const session = await checkSession(c)

    if (!session) {
      throw new ServerError(null, 401, 'User not authenticated')
    }

    if (options.permission) {
      const isGranted = await checkPermission(
        options.permission,
        session.userId
      )

      if (!isGranted) {
        throw new ServerError(null, 401, 'User not authenticated')
      }
    }

    c.set('userId', session.userId)

    return await next()
  })

export async function checkSession(c: Context) {
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME)

  if (!sessionToken) {
    return null
  }

  return checkSessionBySessionToken(sessionToken)
}

export async function checkSessionBySessionToken(sessionToken: string) {
  const session = await db.query.sessions.findFirst({
    where: (session, { eq }) => eq(session.sessionToken, sessionToken),
  })

  if (!session) {
    return null
  }

  if (dayjs(session.expiresAt).isBefore(dayjs())) {
    return null
  }

  return session
}

async function checkPermission(permissions: string | string[], userId: number) {
  const userPermissions = await getPermissionByUserId(userId)

  const defaultOrgPermission = userPermissions.find(
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
