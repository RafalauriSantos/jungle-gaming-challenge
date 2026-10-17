export type Errors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME = /^[a-zA-Z0-9._-]{3,24}$/

export function validateProfile(v: { displayName: string; username: string; email: string }): Errors {
  const e: Errors = {}
  if (v.displayName.trim().length < 2 || v.displayName.trim().length > 60) e.displayName = 'Informe um nome de 2 a 60 caracteres.'
  if (!USERNAME.test(v.username)) e.username = 'Use de 3 a 24 letras, números, ponto, hífen ou sublinhado.'
  if (!EMAIL.test(v.email.trim())) e.email = 'Informe um e-mail válido.'
  return e
}

export function validatePassword(v: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Errors {
  const e: Errors = {}
  if (!v.currentPassword) e.currentPassword = 'Informe a senha atual.'
  if (v.newPassword.length < 8) e.newPassword = 'A senha deve ter ao menos 8 caracteres.'
  else if (v.newPassword === v.currentPassword) e.newPassword = 'A nova senha deve ser diferente da atual.'
  if (v.confirmNewPassword !== v.newPassword) e.confirmNewPassword = 'As senhas não conferem.'
  return e
}
