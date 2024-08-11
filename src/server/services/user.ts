import { DEFAULT_ORG_ID } from '@/server/constants'
import { db } from '@/server/lib/db'
import { organizations, users, usersToOrganizations } from '@/server/models'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import { hash } from 'bcrypt'
import { eq, getTableColumns } from 'drizzle-orm'
import { getPermissionByUserId } from './permission'

export const getUserById = async (
  userId: number,
  options?: {
    withPassword: boolean
  }
) => {
  const { password, ...userColumns } = getTableColumns(users)

  const user = await db
    .select({
      ...userColumns,
      ...(options?.withPassword ? { password } : null),
      organizations: jsonAggBuildObjectOrEmptyArray(organizations, {
        ...getTableColumns(organizations),
      }),
    })
    .from(users)
    .leftJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
    .leftJoin(
      organizations,
      eq(organizations.id, usersToOrganizations.organizationId)
    )
    .groupBy(users.id)
    .where(eq(users.id, userId))

  const userPermissions = await getPermissionByUserId(userId)

  if (!user[0]) {
    return null
  }

  return { ...user[0], permissions: userPermissions }
}

export const createUserByEmailAndPassword = async (data: {
  email: string
  name: string
  password: string
}) => {
  const hashedPassword = await hash(data.password, 16)

  const user = await db
    .insert(users)
    .values({
      ...data,
      password: hashedPassword,
    })
    .returning()

  await db.insert(usersToOrganizations).values({
    organizationId: DEFAULT_ORG_ID,
    userId: user[0].id,
  })

  return user[0]
}

export const updateUserById = async (
  id: number,
  data: Partial<typeof users.$inferInsert>
) => {
  const { password: _, ...columns } = getTableColumns(users)

  const user = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning(columns)

  return user[0]
}

export type User = NonNullable<Awaited<ReturnType<typeof getUserById>>>
