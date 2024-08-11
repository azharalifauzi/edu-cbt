import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { zValidator } from '@hono/zod-validator'
import dayjs from 'dayjs'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import slugify from 'slugify'
import { z } from 'zod'
import { BUCKET_NAME, isProduction } from '../constants'
import { db } from '../lib/db'
import { ServerError } from '../lib/error'
import { generateJsonResponse } from '../lib/response'
import { s3Client } from '../lib/s3'
import { authMiddleware } from '../middlewares/auth'
import { authorsToBlogs, blogs } from '../models'
import { getBlogs } from '../services/blog'
import { ofetch } from 'ofetch'

const getBlogJsonFileKey = (slug: string) => {
  return `sidrstudio/blog/${isProduction ? 'prod' : 'dev'}/${slug}.json`
}

const app = new Hono()
  .get(
    '/',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
      })
    ),
    async (c) => {
      const { page, size } = c.req.valid('query')

      const data = await getBlogs({ page, size, isPublished: true })
      return generateJsonResponse(c, data)
    }
  )
  .get(
    '/admin',
    zValidator(
      'query',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
        search: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    ),
    authMiddleware({ permission: ['read:blogs'] }),
    async (c) => {
      const { page, size, isPublished, search } = c.req.valid('query')

      const data = await getBlogs({ page, size, isPublished, search })
      return generateJsonResponse(c, data)
    }
  )
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        title: z.string(),
        description: z.string(),
        content: z.string(),
        wordCount: z.number(),
        thumbnailUrl: z.string().optional(),
      })
    ),
    authMiddleware({ permission: ['write:blogs'] }),
    async (c) => {
      const { content, description, title, wordCount, thumbnailUrl } =
        c.req.valid('json')

      const slug = slugify(title, {
        lower: true,
        remove: /[*+~.()'"!:@?]/g,
      })

      const existingBlog = await db
        .select()
        .from(blogs)
        .where(eq(blogs.slug, slug))

      if (existingBlog.length > 0) {
        throw new ServerError(
          null,
          400,
          `Blog with slug ${slug} is already exist`
        )
      }

      const upload = await new Upload({
        client: s3Client,
        params: {
          ACL: 'public-read',
          Bucket: BUCKET_NAME,
          Key: getBlogJsonFileKey(slug),
          Body: content,
        },
      }).done()

      const blog = await db
        .insert(blogs)
        .values({
          title,
          description,
          wordCount,
          slug,
          thumbnailUrl,
          jsonUrl: upload.Location!,
        })
        .returning()

      await db.insert(authorsToBlogs).values({
        blogId: blog[0].id,
        authorId: c.get('userId'),
      })

      return generateJsonResponse(c, blog[0], 201)
    }
  )
  .put(
    '/:id',
    zValidator('param', z.object({ id: z.number({ coerce: true }) })),
    zValidator(
      'json',
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        wordCount: z.number().optional(),
        slug: z.string().optional(),
        thumbnailUrl: z.string().optional(),
      })
    ),
    authMiddleware({ permission: ['write:blogs'] }),
    async (c) => {
      const { content, description, title, wordCount, thumbnailUrl, slug } =
        c.req.valid('json')
      const { id } = c.req.valid('param')

      const currentSlug = await db
        .select({ slug: blogs.slug })
        .from(blogs)
        .where(eq(blogs.id, id))

      if (currentSlug.length === 0) {
        throw new ServerError(null, 404, 'Blog not found')
      }

      if (content && currentSlug[0].slug) {
        await new Upload({
          client: s3Client,
          params: {
            ACL: 'public-read',
            Bucket: BUCKET_NAME,
            Key: getBlogJsonFileKey(currentSlug[0].slug),
            Body: content,
          },
        }).done()
      }

      const updated = await db
        .update(blogs)
        .set({
          description,
          title,
          wordCount,
          thumbnailUrl,
          slug,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(blogs.id, id))
        .returning()

      const alreadyBecameAuthor = await db
        .select()
        .from(authorsToBlogs)
        .where(
          and(
            eq(authorsToBlogs.blogId, id),
            eq(authorsToBlogs.authorId, c.get('userId'))
          )
        )

      if (alreadyBecameAuthor.length === 0) {
        await db.insert(authorsToBlogs).values({
          blogId: id,
          authorId: c.get('userId'),
        })
      }

      return generateJsonResponse(c, updated[0])
    }
  )
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.number({ coerce: true }) })),
    authMiddleware({ permission: ['write:blogs'] }),
    async (c) => {
      const { id } = c.req.valid('param')
      const currentSlug = await db
        .select({ slug: blogs.slug })
        .from(blogs)
        .where(eq(blogs.id, id))

      await db.delete(blogs).where(eq(blogs.id, id))

      if (currentSlug?.[0].slug) {
        const deleteObjCmd = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: getBlogJsonFileKey(currentSlug?.[0].slug),
        })
        await s3Client.send(deleteObjCmd)
      }

      return generateJsonResponse(c)
    }
  )
  .post(
    '/:id/publish',
    zValidator('param', z.object({ id: z.number({ coerce: true }) })),
    zValidator('json', z.object({ published: z.boolean() })),
    authMiddleware({ permission: ['write:blogs'] }),
    async (c) => {
      const { id } = c.req.valid('param')
      const { published } = c.req.valid('json')

      const data = await db
        .select({
          createdAt: blogs.createdAt,
          publishedAt: blogs.publishedAt,
          slug: blogs.slug,
          jsonUrl: blogs.jsonUrl,
        })
        .from(blogs)
        .where(eq(blogs.id, id))

      if (data.length === 0) {
        throw new ServerError(null, 404, 'Blog not found')
      }

      const { createdAt, publishedAt, slug, jsonUrl } = data[0]

      const isNeverPublished = dayjs(createdAt).isSame(publishedAt)

      if (published) {
        const content = await ofetch(jsonUrl.replace('.cdn', ''))

        await new Upload({
          client: s3Client,
          params: {
            ACL: 'public-read',
            Bucket: BUCKET_NAME,
            Key: getBlogJsonFileKey(slug).replace('.json', '.published.json'),
            Body: content,
          },
        }).done()
      }

      await db
        .update(blogs)
        .set({
          isPublished: published,
          publishedAt:
            isNeverPublished && published
              ? new Date().toISOString()
              : undefined,
        })
        .where(eq(blogs.id, id))

      return generateJsonResponse(c)
    }
  )

export default app
