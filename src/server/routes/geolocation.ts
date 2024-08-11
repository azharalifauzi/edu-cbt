import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import geoip from 'geoip-lite'
import { generateJsonResponse } from '../lib/response'

const app = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      ip: z.string(),
    })
  ),
  async (c) => {
    const { ip } = c.req.valid('json')

    const geo = geoip.lookup(ip)

    return generateJsonResponse(c, geo)
  }
)

export default app
