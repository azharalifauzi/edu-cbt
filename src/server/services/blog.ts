import { and, count, desc, eq, getTableColumns, ilike } from 'drizzle-orm'
import { authorsToBlogs, blogs, users } from '../models'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import { db } from '../lib/db'

interface GetBlogsParams {
  page?: number
  size?: number
  isPublished?: boolean | undefined
  search?: string
}

export const getBlogs = async ({
  isPublished,
  page = 1,
  size = 10,
  search,
}: GetBlogsParams = {}) => {
  const skip = (page - 1) * size

  const totalCount = await db
    .select({
      count: count(),
    })
    .from(blogs)
    .where(
      typeof isPublished === 'undefined'
        ? undefined
        : eq(blogs.isPublished, isPublished)
    )

  const pageCount = Math.ceil(totalCount[0].count / size)

  const data = await db
    .select({
      ...getTableColumns(blogs),
      authors: jsonAggBuildObjectOrEmptyArray(users, {
        id: users.id,
        name: users.name,
        image: users.image,
      }),
    })
    .from(blogs)
    .leftJoin(authorsToBlogs, eq(blogs.id, authorsToBlogs.blogId))
    .leftJoin(users, eq(authorsToBlogs.authorId, users.id))
    .groupBy(blogs.id)
    .limit(size)
    .offset(skip)
    .orderBy(desc(blogs.publishedAt))
    .where(
      and(
        search ? ilike(users.name, `%${search}%`) : undefined,
        typeof isPublished === 'undefined'
          ? undefined
          : eq(blogs.isPublished, isPublished)
      )
    )

  return {
    pageCount,
    data,
    totalCount: totalCount[0].count,
  }
}

export const getBlogBySlug = async (slug: string) => {
  const data = await db
    .select({
      ...getTableColumns(blogs),
      authors: jsonAggBuildObjectOrEmptyArray(users, {
        id: users.id,
        name: users.name,
        image: users.image,
      }),
    })
    .from(blogs)
    .leftJoin(authorsToBlogs, eq(blogs.id, authorsToBlogs.blogId))
    .leftJoin(users, eq(authorsToBlogs.authorId, users.id))
    .groupBy(blogs.id)
    .where(eq(blogs.slug, slug))

  if (data.length === 0) {
    return null
  }

  return data[0]
}
