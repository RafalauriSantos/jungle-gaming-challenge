import { http } from 'msw'
import { networkScenario } from '../network'
import { accountHandlers } from './account'
import { catalogHandlers } from './catalog'
import { commerceHandlers } from './commerce'

// First in line: the scenario may answer, or delay and pass the request on to the handler it belongs to.
const scenarioGate = http.all('/api/*', () => networkScenario())

export const handlers = [scenarioGate, ...catalogHandlers, ...accountHandlers, ...commerceHandlers]
