import { api } from './client'
import type { AuthResponse, LoginInput, SignupInput } from './types'

export const signupRequest = (input: SignupInput) => api.post<AuthResponse>('/auth/signup', input).then((r) => r.data)
export const loginRequest = (input: LoginInput) => api.post<AuthResponse>('/auth/login', input).then((r) => r.data)
export const logoutRequest = () => api.post('/auth/logout').then(() => undefined)
export const sessionRequest = () => api.get<AuthResponse>('/auth/session').then((r) => r.data)
