import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import bcrypt, { compare, hash } from 'bcrypt'
import { z } from 'zod'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { v4 as uuidv4 } from 'uuid'
import { createSessionToken } from '../utils/session'
import dayjs from 'dayjs'
import { authMiddleware } from '@/server/middlewares/auth'
import { db } from '@/server/lib/db'
import {
  organizations,
  resetPasswords,
  roles,
  rolesToUsers,
  sessions,
  users,
  usersToOrganizations,
} from '@/server/models'
import { and, count, desc, eq, getTableColumns, ilike } from 'drizzle-orm'
import {
  DEFAULT_ORG_ID,
  isProduction,
  SESSION_COOKIE_NAME,
} from '@/server/constants'
import { isEmail } from '../utils'
import {
  createUserByEmailAndPassword,
  getUserById,
  updateUserById,
} from '@/server/services/user'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import { ServerError } from '../lib/error'
import { generateJsonResponse } from '../lib/response'
import crypto from 'crypto'
import { getResetPasswordEmail } from '../email-templates/reset-password'
import { transporter } from '../lib/email'

const app = new Hono()
  .post(
    '/sign-up',
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
        password: z.string(),
        name: z.string(),
      })
    ),
    async (c) => {
      const data = c.req.valid('json')
      const user = await createUserByEmailAndPassword(data)

      const assignedRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.assignedOnSignUp, true))

      if (assignedRoles.length > 0) {
        await db.insert(rolesToUsers).values(
          assignedRoles.map((role) => ({
            roleId: role.id,
            userId: user.id,
            organizationId: DEFAULT_ORG_ID,
          }))
        )
      }

      const sessionId = uuidv4()
      const sessionToken = createSessionToken(sessionId)
      const expiresAt = dayjs().add(7, 'days').toDate()

      await db.insert(sessions).values({
        expiresAt: expiresAt.toISOString(),
        sessionToken,
        userId: user.id,
      })

      setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
        expires: expiresAt,
      })

      return generateJsonResponse(c, user, 201)
    }
  )
  .post(
    '/sign-in',
    zValidator(
      'json',
      z.object({ email: z.string().email(), password: z.string() })
    ),
    async (c) => {
      const data = c.req.valid('json')

      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      })

      if (!user) {
        throw new ServerError(null, 404, 'User not found')
      }

      if (!user?.password) {
        throw new ServerError(
          null,
          400,
          'User register using passwordless method'
        )
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password)

      if (!isPasswordValid) {
        throw new ServerError(null, 401, 'Incorrect password')
      }

      const sessionId = uuidv4()
      const sessionToken = createSessionToken(sessionId)
      const expiresAt = dayjs().add(7, 'days').toDate()

      await db.insert(sessions).values({
        expiresAt: expiresAt.toISOString(),
        sessionToken,
        userId: user.id,
      })

      setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
        expires: expiresAt,
      })

      const { password: _, ...userWithoutPassword } = user

      return generateJsonResponse(c, userWithoutPassword)
    }
  )
  .get('/me', authMiddleware(), async (c) => {
    const userId = c.get('userId')

    const user = await getUserById(userId)

    if (!user) {
      throw new ServerError(null, 404, 'User not found')
    }

    return generateJsonResponse(c, user)
  })
  .post('/logout', async (c) => {
    const sessionToken = getCookie(c, SESSION_COOKIE_NAME)

    if (!sessionToken) {
      return c.json({
        statusCode: 200,
        message: 'OK',
      })
    }

    deleteCookie(c, SESSION_COOKIE_NAME)
    db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))

    return generateJsonResponse(c)
  })
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).positive().optional(),
        size: z.number({ coerce: true }).optional(),
        search: z.string().optional(),
        organizationId: z.number({ coerce: true }).optional(),
      })
    ),
    authMiddleware({
      permission: ['read:users'],
    }),
    async (c) => {
      const {
        page = 1,
        size = 10,
        search,
        organizationId = DEFAULT_ORG_ID,
      } = c.req.valid('query')
      const skip = (page - 1) * size

      const totalCount = await db
        .select({
          count: count(),
        })
        .from(users)
      const pageCount = Math.ceil(totalCount[0].count / size)

      const { password: _, ...columns } = getTableColumns(users)

      const data = await db
        .select(columns)
        .from(users)
        .leftJoin(
          usersToOrganizations,
          eq(users.id, usersToOrganizations.userId)
        )
        .leftJoin(
          organizations,
          eq(usersToOrganizations.organizationId, organizations.id)
        )
        .where(
          and(
            search && isEmail(search)
              ? ilike(users.email, search)
              : search
              ? ilike(users.name, `%${search}%`)
              : undefined,
            eq(usersToOrganizations.organizationId, organizationId)
          )
        )
        .limit(size)
        .offset(skip)
        .orderBy(desc(users.createdAt))

      return generateJsonResponse(c, {
        data,
        pageCount,
        totalCount: totalCount[0].count,
      })
    }
  )
  .get(
    '/:id',
    authMiddleware({
      permission: ['read:users'],
    }),
    async (c) => {
      const user = await getUserById(Number(c.req.param('id')))

      if (!user) {
        throw new ServerError(null, 404, 'User not found')
      }

      return generateJsonResponse(c, user)
    }
  )
  .get(
    '/:id/roles',
    authMiddleware({
      permission: ['read:users'],
    }),
    async (c) => {
      const userId = Number(c.req.param('id'))

      const data = await db
        .select({
          orgId: organizations.id,
          orgName: organizations.name,
          roles: jsonAggBuildObjectOrEmptyArray(roles, {
            ...getTableColumns(roles),
          }),
        })
        .from(organizations)
        .leftJoin(
          rolesToUsers,
          eq(organizations.id, rolesToUsers.organizationId)
        )
        .leftJoin(roles, eq(rolesToUsers.roleId, roles.id))
        .where(eq(rolesToUsers.userId, userId))
        .groupBy(organizations.id)

      return generateJsonResponse(c, data)
    }
  )
  .post(
    '/:id/assign-role',
    authMiddleware({
      permission: ['write:users'],
    }),
    zValidator(
      'json',
      z.object({
        roleId: z.number({ coerce: true }),
        organizationId: z.number({ coerce: true }),
      })
    ),
    async (c) => {
      const id = c.req.param('id')
      const { roleId, organizationId } = c.req.valid('json')

      await db.insert(rolesToUsers).values({
        organizationId,
        roleId,
        userId: Number(id),
      })

      return generateJsonResponse(c)
    }
  )
  .post(
    '/:id/unassign-role',
    authMiddleware({
      permission: ['write:users'],
    }),
    zValidator(
      'json',
      z.object({
        roleId: z.number({ coerce: true }),
        organizationId: z.number({ coerce: true }),
      })
    ),
    async (c) => {
      const id = c.req.param('id')
      const { roleId, organizationId } = c.req.valid('json')

      await db
        .delete(rolesToUsers)
        .where(
          and(
            eq(rolesToUsers.organizationId, organizationId),
            eq(rolesToUsers.userId, Number(id)),
            eq(rolesToUsers.roleId, roleId)
          )
        )

      return generateJsonResponse(c)
    }
  )
  .post(
    '/:id/assign-organization',
    authMiddleware({
      permission: ['write:users'],
    }),
    zValidator(
      'json',
      z.object({
        organizationId: z.number({ coerce: true }),
      })
    ),
    async (c) => {
      const id = c.req.param('id')
      const { organizationId } = c.req.valid('json')

      await db.insert(usersToOrganizations).values({
        organizationId,
        userId: Number(id),
      })

      return generateJsonResponse(c)
    }
  )
  .post(
    '/:id/unassign-organization',
    authMiddleware({
      permission: ['write:users'],
    }),
    zValidator(
      'json',
      z.object({
        organizationId: z.number({ coerce: true }),
      })
    ),
    async (c) => {
      const id = c.req.param('id')
      const { organizationId } = c.req.valid('json')

      await db
        .delete(usersToOrganizations)
        .where(
          and(
            eq(usersToOrganizations.organizationId, organizationId),
            eq(usersToOrganizations.userId, Number(id))
          )
        )

      return generateJsonResponse(c)
    }
  )
  .post(
    '/',
    authMiddleware({
      permission: ['write:users'],
    }),
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
        password: z.string(),
        name: z.string(),
      })
    ),
    async (c) => {
      const data = c.req.valid('json')
      const user = await createUserByEmailAndPassword(data)

      return generateJsonResponse(c, user, 201)
    }
  )
  .put(
    '/me',
    authMiddleware(),
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
        image: z.string().optional().nullable(),
      })
    ),
    async (c) => {
      const id = c.get('userId')
      const data = c.req.valid('json')

      const user = await updateUserById(id, data)

      return generateJsonResponse(c, user)
    }
  )
  .post(
    '/me/change-password',
    authMiddleware(),
    zValidator(
      'json',
      z.object({
        oldPassword: z.string(),
        newPassword: z.string(),
      })
    ),
    async (c) => {
      const id = c.get('userId')
      const user = await getUserById(id, {
        withPassword: true,
      })
      const data = c.req.valid('json')

      if (!user) {
        throw new ServerError(null, 401, 'User not authenticated')
      }

      const canChangePassword = await compare(data.oldPassword, user.password!)

      if (!canChangePassword) {
        throw new ServerError(null, 401, 'Old password is wrong')
      }

      const hashedPassword = await hash(data.newPassword, 16)

      await updateUserById(id, {
        password: hashedPassword,
      })

      return generateJsonResponse(c)
    }
  )
  .put(
    '/:id',
    authMiddleware({
      permission: ['write:users'],
    }),
    zValidator(
      'json',
      z.object({
        name: z.string().optional(),
      })
    ),
    async (c) => {
      const id = Number(c.req.param('id'))
      const data = c.req.valid('json')

      const user = await updateUserById(id, data)

      return generateJsonResponse(c, user)
    }
  )
  .post(
    '/forgot-password',
    zValidator(
      'json',
      z.object({
        email: z.string().email(),
      })
    ),
    async (c) => {
      const { email } = c.req.valid('json')
      const user = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.email, email))

      if (user.length === 0) {
        throw new ServerError(
          null,
          404,
          `User with ${email} email, has never been registered.`
        )
      }

      const token = crypto.randomBytes(32).toString('hex')
      await db.insert(resetPasswords).values({
        token,
        userId: user[0].id,
        expiredAt: dayjs().add(1, 'hour').toISOString(),
      })

      const link = `${
        isProduction ? 'https://educbt.sidrstudio.com' : 'http://localhost:4321'
      }/change-password?token=${token}`

      const emailBody = getResetPasswordEmail(link, user[0].name)
      await transporter.sendMail({
        from: '"EduCBT Team" <noreply@sidrstudio.com>',
        to: email,
        subject: 'EduCBT: Reset password request',
        html: emailBody,
        headers: {
          isTransactional: 'true',
        },
      })

      return generateJsonResponse(c)
    }
  )
  .post(
    '/forgot-password/change',
    zValidator(
      'json',
      z.object({
        token: z.string().min(1, 'Token is required'),
        password: z.string(),
      })
    ),
    async (c) => {
      const { password, token } = c.req.valid('json')

      const resetPassword = await db
        .select()
        .from(resetPasswords)
        .where(eq(resetPasswords.token, token))

      if (resetPassword.length === 0) {
        throw new ServerError(null, 400, 'Your reset password token is invalid')
      }

      const { expiredAt, userId } = resetPassword[0]

      if (
        dayjs(expiredAt.split(' ').join('T') + 'Z').isBefore(
          dayjs(dayjs().toISOString())
        )
      ) {
        throw new ServerError(
          null,
          400,
          'Your reset password request is already expired.'
        )
      }
      const hashedPassword = await hash(password, 16)

      await db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, userId))

      await db.delete(resetPasswords).where(eq(resetPasswords.token, token))

      return generateJsonResponse(c)
    }
  )

export default app
