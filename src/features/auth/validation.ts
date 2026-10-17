export type Errors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-zA-Z0-9._-]{3,24}$/

export function validateLogin(v: { email: string; password: string }): Errors {
  const e: Errors = {}
  if (!EMAIL.test(v.email.trim())) e.email = 'Informe um e-mail válido.'
  if (!v.password) e.password = 'Informe a senha.'
  return e
}

export function validateSignup(v: { username: string; email: string; password: string; confirmPassword: string }): Errors {
  const e: Errors = {}
  if (!USERNAME.test(v.username)) e.username = 'Use de 3 a 24 letras, números, ponto, hífen ou sublinhado.'
  if (!EMAIL.test(v.email.trim())) e.email = 'Informe um e-mail válido.'
  if (v.password.length < 8) e.password = 'A senha deve ter ao menos 8 caracteres.'
  if (v.confirmPassword !== v.password) e.confirmPassword = 'As senhas não conferem.'
  return e
}
