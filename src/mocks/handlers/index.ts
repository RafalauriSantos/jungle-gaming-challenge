import { accountHandlers } from './account'
import { catalogHandlers } from './catalog'

export const handlers = [...catalogHandlers, ...accountHandlers]
