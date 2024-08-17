import { defineMiddleware } from 'astro:middleware'
import { checkSessionBySessionToken } from './server/middlewares/auth'
import { SESSION_COOKIE_NAME } from './server/constants'
import { getUserById } from './server/services/user'
import type { APIContext } from 'astro'

const isLoggedin = async (context: APIContext) => {
  const sessionToken = context.cookies.get(SESSION_COOKIE_NAME)

  if (!sessionToken) {
    return null
  }

  const session = await checkSessionBySessionToken(sessionToken.value)

  if (!session) {
    return null
  }

  const user = await getUserById(session.userId)

  return user
}

const publicUrl = ['/login', '/sign-up', '/forgot-password', '/change-password']

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/api')) {
    return next()
  }

  if (!publicUrl.includes(context.url.pathname)) {
    const user = await isLoggedin(context)
    if (!user) {
      return context.redirect('/login')
    }

    context.locals.user = user

    return next()
  }

  if (publicUrl.includes(context.url.pathname) && (await isLoggedin(context))) {
    return context.redirect('/')
  }

  return next()
})
