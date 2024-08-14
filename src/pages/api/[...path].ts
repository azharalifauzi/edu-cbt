import app from '@/server'
import type { APIRoute } from 'astro'

export const ALL: APIRoute = (context) => {
  return app.fetch(context.request)
}
