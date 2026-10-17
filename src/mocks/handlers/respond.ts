import { HttpResponse } from 'msw'
import { authenticate } from '../services/auth'
import { ApiFailure, fail } from '../failure'
import { db } from '../db'

export const bearer = (request: Request) => request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null

/** The user behind the request's token, or a 401. Every private handler starts here. */
export function callerOf(request: Request) {
  // Scenarios for the two ways a signed-in user can be turned away.
  if (db.state.scenario === 'session-expired') throw fail(401, 'session_expired', 'Sua sessão expirou. Entre novamente.')
  if (db.state.scenario === 'unauthorized') throw fail(403, 'forbidden', 'Você não tem permissão para acessar este recurso.')
  return authenticate(db, bearer(request))
}

/** Runs a handler body and turns business errors into their HTTP answer. */
export async function respond(run: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof ApiFailure) return HttpResponse.json(error.body, { status: error.status })
    throw error
  }
}
