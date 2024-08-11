import { type StatusCode } from 'hono/utils/http-status'

export class ServerError extends Error {
  private statusCode: StatusCode = 500
  public message = 'Something went wrong'
  private data: any

  constructor(data: any, statusCode: StatusCode, message: string) {
    super(message)
    this.statusCode = statusCode
    this.message = message
    this.data = data
  }

  get response() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      data: this.data || null,
    }
  }
}
