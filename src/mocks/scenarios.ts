/** Named, reproducible behaviors of the mock backend (MOCK-S01..S17). `ready` marks those already wired. */
export const SCENARIOS = [
  { name: 'success', label: 'Sucesso (padrão)', ready: true },
  { name: 'empty', label: 'Resultado vazio', ready: true },
  { name: 'slow', label: 'Latência alta e variável', ready: true },
  { name: 'out-of-order', label: 'Respostas fora de ordem', ready: true },
  { name: 'offline', label: 'Falha de conexão', ready: true },
  { name: 'http-4xx', label: 'Erro HTTP 4xx', ready: true },
  { name: 'http-5xx', label: 'Erro HTTP 5xx', ready: true },
  { name: 'session-expired', label: 'Sessão expirada', ready: true },
  { name: 'unauthorized', label: 'Acesso não autorizado', ready: true },
  { name: 'signup-conflict', label: 'Conflito de cadastro', ready: true },
  { name: 'coupon-invalid', label: 'Cupom inválido', ready: true },
  { name: 'coupon-expired', label: 'Cupom expirado', ready: true },
  { name: 'price-changed', label: 'Preço alterado na compra (uma vez)', ready: true },
  { name: 'sold-out', label: 'Edição esgotada na compra (uma vez)', ready: true },
  { name: 'order-timeout', label: 'Timeout após criar o pedido', ready: true },
  { name: 'wallet-refused', label: 'Conexão da carteira recusada', ready: true },
  { name: 'payment-confirmed', label: 'Pagamento confirmado', ready: true },
  { name: 'payment-refused', label: 'Pagamento recusado', ready: true },
] as const

export type ScenarioName = (typeof SCENARIOS)[number]['name']
export const isScenario = (name: string): name is ScenarioName => SCENARIOS.some((s) => s.name === name)
