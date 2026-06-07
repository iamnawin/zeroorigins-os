// Minimal validation helpers for public-facing forms.
// Internal forms intentionally skip this — see CLAUDE.md.

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidPhoneLike(phone: string): boolean {
  return /^[\d\s+\-()\[\]]{7,}$/.test(phone.trim())
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min
}
