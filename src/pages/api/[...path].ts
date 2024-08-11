import app from '@/server'
import type { APIRoute } from 'astro'

export const ALL: APIRoute = (context) => {
  console.log(context.url.toString())
  return app.fetch(context.request)
}
