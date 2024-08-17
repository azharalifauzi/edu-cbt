export const isProduction = process.env.NODE_ENV === 'production'
export const DEFAULT_ORG_ID = Number(process.env.DEFAULT_ORG_ID) || 1
export const DATABASE_URL = process.env.DATABASE_URL
export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || 'session_token'
export const DO_SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT
export const DO_SPACES_ACCESS_KEY_ID = process.env.DO_SPACES_ACCESS_KEY_ID
export const DO_SPACES_SECRET_KEY = process.env.DO_SPACES_SECRET_KEY
export const BUCKET_NAME = process.env.DO_BUCKET_NAME
export const SMTP_USERNAME = process.env.SMTP_USERNAME
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD
export const SMTP_HOST = process.env.SMTP_HOST
export const SMTP_PORT = Number(process.env.SMTP_PORT)
