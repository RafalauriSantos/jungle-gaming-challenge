const DECIMALS = 18

/** Parses a decimal ETH string into wei (bigint) without floating point. */
export function ethToWei(value: string): bigint {
  const [whole = '0', frac = ''] = value.split('.')
  return BigInt(whole + frac.padEnd(DECIMALS, '0').slice(0, DECIMALS))
}

/** Formats wei back into a trimmed decimal ETH string. */
export function weiToEth(wei: bigint): string {
  const s = wei.toString().padStart(DECIMALS + 1, '0')
  const whole = s.slice(0, -DECIMALS)
  const frac = s.slice(-DECIMALS).replace(/0+$/, '')
  return frac ? `${whole}.${frac}` : whole
}
