// Simple client-side encryption helper for storing sensitive data in localStorage
// Uses Web Crypto (AES-GCM) with PBKDF2 key derivation.

export interface EncryptedPayload {
  v: number // version
  iv: string // base64
  salt: string // base64
  ct: string // base64
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptToPayload(secret: string, plaintext: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(secret, salt)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(plaintext)
  )
  return {
    v: 1,
    iv: toBase64(iv.buffer),
    salt: toBase64(salt.buffer),
    ct: toBase64(ct),
  }
}

export async function decryptFromPayload(secret: string, payload: EncryptedPayload): Promise<string> {
  const iv = fromBase64(payload.iv)
  const salt = fromBase64(payload.salt)
  const key = await deriveKey(secret, salt)
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    fromBase64(payload.ct)
  )
  return textDecoder.decode(pt)
}

// Storage helpers
const prefix = 'asteria-sec-key-'

export async function secureSave(provider: string, apiKey: string, secret: string): Promise<void> {
  // localStorage disabled for app data - API keys not saved
  return
}

export async function secureLoad(provider: string, secret: string): Promise<string | ''> {
  // localStorage disabled for app data
  return ''
}

export function secureHas(provider: string): boolean {
  // localStorage disabled for app data
  return false
}


