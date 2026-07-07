/**
 * End-to-End Encryption Utility
 * Uses ECDH (P-256) for key exchange + AES-GCM for symmetric encryption.
 * Private key stays in localStorage — never sent to server.
 * Public key is stored in Firestore user profile for others to use.
 */

const PRIVATE_KEY_STORAGE = 'e2e_private_key';
const PUBLIC_KEY_STORAGE = 'e2e_public_key';

// ── Key Generation ────────────────────────────────────────────────────────────

export async function generateKeyPair(): Promise<{ publicKeyJwk: JsonWebKey; privateKeyJwk: JsonWebKey }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // exportable
    ['deriveKey']
  );

  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  return { publicKeyJwk, privateKeyJwk };
}

// ── Key Storage ───────────────────────────────────────────────────────────────

export async function ensureKeyPair(): Promise<JsonWebKey> {
  const storedPriv = localStorage.getItem(PRIVATE_KEY_STORAGE);
  const storedPub = localStorage.getItem(PUBLIC_KEY_STORAGE);

  if (storedPriv && storedPub) {
    return JSON.parse(storedPub); // return public key JWK
  }

  const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();
  localStorage.setItem(PRIVATE_KEY_STORAGE, JSON.stringify(privateKeyJwk));
  localStorage.setItem(PUBLIC_KEY_STORAGE, JSON.stringify(publicKeyJwk));
  return publicKeyJwk;
}

export function getStoredPublicKeyJwk(): JsonWebKey | null {
  const stored = localStorage.getItem(PUBLIC_KEY_STORAGE);
  return stored ? JSON.parse(stored) : null;
}

// ── Key Import ────────────────────────────────────────────────────────────────

async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );
}

// ── Shared Secret Derivation ──────────────────────────────────────────────────

async function deriveSharedKey(
  myPrivateKeyJwk: JsonWebKey,
  theirPublicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const myPrivateKey = await importPrivateKey(myPrivateKeyJwk);
  const theirPublicKey = await importPublicKey(theirPublicKeyJwk);

  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Encrypt / Decrypt ─────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext message using the recipient's public key + our private key.
 * Returns base64(iv + ciphertext)
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyJwk: JsonWebKey
): Promise<string> {
  try {
    const myPrivKeyJwk = localStorage.getItem(PRIVATE_KEY_STORAGE);
    if (!myPrivKeyJwk) throw new Error('No private key found');

    const sharedKey = await deriveSharedKey(
      JSON.parse(myPrivKeyJwk),
      recipientPublicKeyJwk
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encoded
    );

    // Combine iv + ciphertext into a single base64 string
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.warn('Encryption failed, sending as plaintext:', err);
    return plaintext; // fallback: send unencrypted
  }
}

/**
 * Decrypt a ciphertext using the sender's public key + our private key.
 * Expects base64(iv + ciphertext) as produced by encryptMessage.
 */
export async function decryptMessage(
  ciphertextB64: string,
  senderPublicKeyJwk: JsonWebKey
): Promise<string> {
  try {
    const myPrivKeyJwk = localStorage.getItem(PRIVATE_KEY_STORAGE);
    if (!myPrivKeyJwk) throw new Error('No private key found');

    const sharedKey = await deriveSharedKey(
      JSON.parse(myPrivKeyJwk),
      senderPublicKeyJwk
    );

    // Decode base64
    const combined = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // If decryption fails, return as-is (may be unencrypted legacy message)
    return ciphertextB64;
  }
}

/**
 * Check if a string looks like an encrypted message (base64 with no spaces).
 */
export function isEncrypted(text: string): boolean {
  if (text.length < 20) return false;
  try {
    const decoded = atob(text);
    return decoded.length >= 12; // at least IV length
  } catch {
    return false;
  }
}
