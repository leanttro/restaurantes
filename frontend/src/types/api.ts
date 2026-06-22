export interface ApiErrorBody {
  detail?: string | { msg: string; loc?: (string | number)[] }[]
  message?: string
  status_code?: number
}

export class ApiError extends Error {
  status: number
  body?: ApiErrorBody
  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface ApiSuccess<T> { data: T; message?: string }
