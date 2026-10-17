import type { ErrorBody, ErrorCode } from '@/api/types'

/** A business error with the HTTP status the handler should answer with. */
export class ApiFailure extends Error {
  readonly status: number
  readonly body: ErrorBody

  constructor(status: number, body: ErrorBody) {
    super(body.message)
    this.status = status
    this.body = body
  }
}

export const fail = (status: number, code: ErrorCode, message: string, fields?: Record<string, string>, details?: unknown) =>
  new ApiFailure(status, { code, message, ...(fields && { fields }), ...(details !== undefined && { details }) })
