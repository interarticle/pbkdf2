import { stringToBytesCheckingAscii } from '../binutil';
import { PasswordGenerator } from '../password/generator';

export class MainGenerator {
  private masterKey: CryptoKey | null = null;
  constructor(private readonly pbkdfKey: CryptoKey, private readonly saltKey: CryptoKey) { }

  async updateMasterPassword(password: string) {
    const passwordBytes = stringToBytesCheckingAscii(password);
    const masterSign = await crypto.subtle.deriveKey(
      {name: 'PBKDF2', salt: passwordBytes, iterations: 1, hash: 'SHA-512'},
      this.pbkdfKey, {name: 'HMAC', hash: 'SHA-512', length: 1024},
      true, ['sign']);
    const masterBytes = await crypto.subtle.exportKey('raw', masterSign);
    this.masterKey = await crypto.subtle.importKey(
      'raw', masterBytes, {name: 'PBKDF2'}, false, ['deriveBits']);
  }

  get hasMasterKey() {
    return this.masterKey != null;
  }

  async generatePassword(salt: string, rounds: number, passwordGen: PasswordGenerator): Promise<string> {
    if (!this.masterKey) throw new Error('master key not available');
    const saltBytes = stringToBytesCheckingAscii(salt);
    const saltSigned = await crypto.subtle.sign('HMAC', this.saltKey, saltBytes);
    const derivedBits = await crypto.subtle.deriveBits(
      {name: 'PBKDF2', salt: saltSigned, iterations: rounds, hash: 'SHA-512'}, this.masterKey,
      512);
    return await passwordGen.generate(
      await crypto.subtle.importKey(
        'raw', derivedBits, {name: 'PBKDF2'}, false, ['deriveBits']));
  }
}
