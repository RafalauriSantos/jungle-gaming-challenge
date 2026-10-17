import { HttpResponse } from 'msw'
import { authenticate } from '../services/auth'
import { ApiFailure } from '../failure'
import { db } from '../db'

export const bearer = (request: Request) => request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null

/** The user behind the request's token, or a 401. Every private handler starts here. */
export const callerOf = (request: Request) => authenticate(db, bearer(request))

/** Runs a handler body and turns business errors into their HTTP answer. */
export async function respond(run: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof ApiFailure) return HttpResponse.json(error.body, { status: error.status })
    throw error
  }
}
