import * as ObjectMap from '../indexed_db_object_map';
import { stringToBytesCheckingAscii, parseHexString } from '../binutil';

export class KeySetup {
  private constructor(private readonly keyStore: ObjectMap.AsyncMap) { }

  static async open(mapName: string): Promise<KeySetup> {
    return new KeySetup(await ObjectMap.open(mapName));
  }

  get pbkdf2Rounds(): number {
    return 100000000;
  }

  async getStoredKeys(): Promise<[CryptoKey, CryptoKey] | null> {
    const pbkdfKey = await this.keyStore.get('pbkdf-key');
    const saltKey = await this.keyStore.get('salt-key');
    if (!pbkdfKey && !saltKey) return null;
    if (!pbkdfKey) throw new Error('PBKDF2 key missing');
    if (!saltKey) throw new Error('Salt key missing');
    if (saltKey.algorithm.name != 'HMAC' || saltKey.algorithm.hash.name != 'SHA-512') {
      throw new Error('Invalid salt key algorithm: ' + saltKey.algorithm);
    }
    await crypto.subtle.deriveKey(
      {name: 'PBKDF2', salt: new Uint8Array(0), iterations: 1, hash: 'SHA-512'}, pbkdfKey,
      {name: 'HMAC', hash: 'SHA-512', length: 1024}, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', saltKey, new Uint8Array(10));
    if (new Uint8Array(signature).length != 64) {
      throw new Error('HMAC key has unexpected hash length.');
    }
    return [pbkdfKey, saltKey];
  }

  async setKey(setupKeyHex: string): Promise<void> {
    const keyBytes = parseHexString(setupKeyHex);
    if (keyBytes.length != 64) {
      throw new Error(`Setup key has invalid length ${keyBytes.length} != 64`);
    }
    const pbkdfKey = await crypto.subtle.importKey(
      'raw', keyBytes, {name: 'PBKDF2'}, false, ['deriveKey']);
    const saltKey = await crypto.subtle.importKey(
      'raw', keyBytes, {name: 'HMAC', hash: 'SHA-512'}, false, ['sign']);
    this.keyStore.put('pbkdf-key', pbkdfKey);
    this.keyStore.put('salt-key', saltKey);
    if (await this.getStoredKeys() == null) {
      throw new Error('key storage failed unexpectedly');
    }
  }

  close() {
    this.keyStore.close();
  }
}
