export class Pbkdf2SpeedTester {
  private readonly dummyKeyBytes = new Uint8Array(128);
  private ips: number | null = null;

  get dataAvailable(): boolean {
    return this.ips != null;
  }

  get iterationsPerSecond(): number {
    if (this.ips == null) throw new Error('test data not available');
    return this.ips;
  }

  async test() {
    const key = await crypto.subtle.importKey(
      'raw', this.dummyKeyBytes, {name: 'PBKDF2'}, false, ['deriveBits']);
    let iterations = 0;
    let elapsedMillis = 0;
    const saltBytes = new Uint8Array(64);
    for (iterations = 10000; iterations < (1 << 30) && iterations > 0; iterations *= 10) {
      crypto.getRandomValues(saltBytes);
      const start = new Date().getTime();
      await crypto.subtle.deriveBits(
        {name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-512'},
        key, 512);
      elapsedMillis = new Date().getTime() - start;
      if (elapsedMillis > 300) break;
    }
    this.ips = iterations / elapsedMillis * 1000;
  }
}
