export function sanitizeString(input: string, maxLength = 5000): string {
  return input.trim().slice(0, maxLength)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function validateChatInput(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' }
  }
  const trimmed = message.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' }
  }
  if (trimmed.length > 5000) {
    return { valid: false, error: 'Message too long (max 5000 characters)' }
  }
  return { valid: true }
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { valid: false, error: 'Name must be 1-100 characters' }
  }
  return { valid: true }
}
