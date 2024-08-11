import { S3Client } from '@aws-sdk/client-s3'
import {
  DO_SPACES_ACCESS_KEY_ID,
  DO_SPACES_ENDPOINT,
  DO_SPACES_SECRET_KEY,
} from '../constants'

export const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: DO_SPACES_ENDPOINT,
  forcePathStyle: false,
  credentials: {
    accessKeyId: DO_SPACES_ACCESS_KEY_ID,
    secretAccessKey: DO_SPACES_SECRET_KEY,
  },
})
