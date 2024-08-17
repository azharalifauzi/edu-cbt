import nodemailer from 'nodemailer'
import {
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from '../constants'

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
})
