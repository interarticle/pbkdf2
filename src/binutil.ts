/** Binary utilities */
const minPrintable = 0x20;
const maxPrintable = 0x7e;

export function stringToBytesCheckingAscii(str: string): Uint8Array {
  const result = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    if (ch < minPrintable || ch > maxPrintable) {
      throw new Error('Unsupported non-ASCII or unprintable character code 0x' + ch.toString(16));
    }
    result[i] = ch;
  }
  return result;
}

export function parseHexString(hex: string): Uint8Array {
  if ((hex.length % 2) != 0) {
    throw new Error('Hex string should have even length');
  }
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byteHex = hex.substring(i, i + 2)
    result[i / 2] = parseInt(byteHex, 16);
  }
  return result;
}
