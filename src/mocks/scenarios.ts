/** Named, reproducible behaviors of the mock backend (MOCK-S01..S17). `ready` marks those already wired. */
export const SCENARIOS = [
  { name: 'success', label: 'Sucesso (padrão)', ready: true },
  { name: 'empty', label: 'Resultado vazio', ready: false },
  { name: 'slow', label: 'Latência alta e variável', ready: false },
  { name: 'out-of-order', label: 'Respostas fora de ordem', ready: false },
  { name: 'offline', label: 'Falha de conexão', ready: false },
  { name: 'http-4xx', label: 'Erro HTTP 4xx', ready: false },
  { name: 'http-5xx', label: 'Erro HTTP 5xx', ready: false },
  { name: 'session-expired', label: 'Sessão expirada', ready: false },
  { name: 'unauthorized', label: 'Acesso não autorizado', ready: false },
  { name: 'signup-conflict', label: 'Conflito de cadastro', ready: true },
  { name: 'coupon-invalid', label: 'Cupom inválido', ready: false },
  { name: 'coupon-expired', label: 'Cupom expirado', ready: false },
  { name: 'price-changed', label: 'Preço alterado na compra', ready: false },
  { name: 'sold-out', label: 'Edição esgotada na compra', ready: false },
  { name: 'order-timeout', label: 'Timeout após criar o pedido', ready: false },
  { name: 'payment-confirmed', label: 'Pagamento confirmado', ready: false },
  { name: 'payment-refused', label: 'Pagamento recusado', ready: false },
] as const

export type ScenarioName = (typeof SCENARIOS)[number]['name']
export const isScenario = (name: string): name is ScenarioName => SCENARIOS.some((s) => s.name === name)
