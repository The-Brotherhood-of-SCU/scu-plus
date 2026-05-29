import { sm2 } from 'sm-crypto';

function base64ToHex(base64: string): string {
  const clean = base64.replace(/\s+/g, "");
  const binary = atob(clean);
  let hex = "";
  for (let i = 0; i < binary.length; i++) {
    const h = binary.charCodeAt(i).toString(16).padStart(2, "0");
    hex += h;
  }
  return hex;
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

function uint8ArrayToBase64(u8: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

function reorderC1C3C2toC1C2C3(hex: string): string {
  // Handle both cases where C1 is prefixed with '04' (130 hex chars) or not (128 hex chars).
  const C3_LEN = 64; // 32 bytes
  if (hex.length <= C3_LEN + 128) return hex; // too short
  // detect if starts with '04' prefix for C1
  let c1Len = hex.startsWith('04') ? 130 : 128;
  if (hex.length <= c1Len + C3_LEN) return hex;
  const c1 = hex.slice(0, c1Len);
  const c3 = hex.slice(c1Len, c1Len + C3_LEN);
  const c2 = hex.slice(c1Len + C3_LEN);
  return c1 + c2 + c3;
}

export async function encryptToBase6404C1C2C3(plaintext: string, pubKeyBase64OrHex: string): Promise<string> {
  // Accept public key either as base64 or hex. Normalize to hex without prefixes.
  let pubKeyHex = pubKeyBase64OrHex.trim();
  // crude check for base64: contains non-hex chars and length divisible by 4
  if (/[^0-9a-fA-F]/.test(pubKeyHex)) {
    try {
      pubKeyHex = base64ToHex(pubKeyHex);
    } catch (e) {
      // fallback: assume input already hex
    }
  }

  // sm2.doEncrypt accepts public key hex string (uncompressed). Try cipherMode=0 first (C1C2C3)
  try {
    const cipherHex0 = sm2.doEncrypt(plaintext, pubKeyHex, 0); // try mode 0 (expected C1C2C3)
    if (cipherHex0 && cipherHex0.length >= 1) {
      // ensure 04 prefix present for final bytes
      const finalHex = cipherHex0.startsWith('04') ? cipherHex0 : '04' + cipherHex0;
      const u8 = hexToUint8Array(finalHex);
      return uint8ArrayToBase64(u8);
    }
  } catch (e) {
    // ignore and try the other mode
  }

  // fallback: try cipherMode=1 (some libs output C1C3C2), then reorder
  const cipherHex1 = sm2.doEncrypt(plaintext, pubKeyHex, 1);
  let fixedHex = cipherHex1 || '';
  // If it appears to be C1C3C2, reorder to C1C2C3
  if (cipherHex1 && cipherHex1.length > 192) {
    fixedHex = reorderC1C3C2toC1C2C3(cipherHex1);
  }
  // ensure 04 prefix
  const finalHex = fixedHex.startsWith('04') ? fixedHex : '04' + fixedHex;
  const u8 = hexToUint8Array(finalHex);
  return uint8ArrayToBase64(u8);
}

export default encryptToBase6404C1C2C3;
