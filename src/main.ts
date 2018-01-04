import * as ObjectWatcher from './object_watcher';
import * as IndexedDBObjectMap from './indexed_db_object_map';
import { Pbkdf2SpeedTester } from './crypto/speed_tester';
import * as PasswordGen from './password/generator';
import { KeySetup } from  './crypto/key_setup';
import { MainGenerator } from './crypto/main_generator';

const KEY_STORE_NAME = 'setup-key-store';
const AUTO_CLEAR_DELAY_MILLIS = 60000;

const ENTER_PASSWORD_PLACEHOLDER = 'Enter your master password';

class DefaultScope {
  main = {
    password: '',
    salt: {
      siteUser: '',
      year: new Date().getFullYear().toString(),
      revision: '0',
    },
    saltValue: '',
    roundsText: '5000000',
    rounds: 5000000,
    passwordScheme: 'CapitalNormalNum10',

    busy: false,
    progress: '',
    output: '',
    passwordStatus: ENTER_PASSWORD_PLACEHOLDER,
    clearMsg: '',
  };
  testing = {
    busy: false,
  };
  setup = {
    keyHex: '',
    status: '',
    busy: false,
    keyAvailable: false,
    storeError: false,
    keyStatus: '',
    progress: '',
  };
  hashBusy = false;
  mainDisable = false;
  setupDisable = false;
}
export class MainController {
  private readonly $scope = ObjectWatcher.wrap(new DefaultScope());
  private readonly speedTester = new Pbkdf2SpeedTester();
  private keySetup: KeySetup | null = null;
  private mainGenerator: MainGenerator | null = null;
  private lastComputeTime: Date | null = null;

  constructor() {
    this.setupScope();
  }

  private setupScope() {
    this.$scope.$watch<string>('main.roundsText', (v, s) => s.main.rounds = parseInt(v));
    this.$scope.$watch(
      s => s.main.busy || s.testing.busy || s.setup.busy, (v, s) => s.hashBusy = v);
    this.$scope.$watch(s => s.main.busy || !s.setup.keyAvailable, (v, s) => s.mainDisable = v);
    this.$scope.$watch(s => s.setup.busy || s.setup.keyAvailable, (v, s) => s.setupDisable = v);
    this.$scope.$watch('setup.keyAvailable', (v, s) => {
      if (v) {
        s.setup.keyStatus = 'Click "Destroy Key" to reset key';
      } else {
        s.setup.keyStatus = 'Enter key and click set key to store';
      }
    });
    this.$scope.$watch<string>(
      'main.salt.siteUser', (v, s) => s.main.salt.siteUser = v.toLowerCase());
    this.$scope.$watch(
      s => `${s.main.salt.siteUser}/${s.main.salt.year}/${s.main.salt.revision}`,
      (v, s) => s.main.saltValue = v);
  }

  bootstrap() {
    this.bindElements();
    this.start();
  }

  private bindElements() {
    ObjectWatcher.bindElements(document.body, this.$scope);
    document.querySelector('#test-speed')!
      .addEventListener('click', this.wrapErrorsAndBind(this.onTestSpeed));
    document.querySelector('#destroy-setup-key')!
      .addEventListener('click', this.wrapErrorsAndBind(this.onDestroySetupKey));
    document.querySelector('#set-setup-key')!
      .addEventListener('click', this.wrapErrorsAndBind(this.onSetSetupKey));
    document.querySelector('#copy-output')!
      .addEventListener('click', this.wrapErrorsAndBind(this.onCopyOutput));
    document.querySelector('#compute')!
      .addEventListener('click', this.wrapErrorsAndBind(this.onCompute));
    document.querySelector('#clear-output')!
      .addEventListener('click', this.wrapErrorsAndBind(this.onClearOutput));
    setInterval(this.onTick.bind(this), 1000);
  }

  private wrapErrorsAndBind(fn: () => Promise<any>) {
    const bound = fn.bind(this);
    return async () => {
      try {
        await bound();
      } catch (err) {
        alert('Error: ' + err);
        console.error(err);
      }
    }
  }

  private start() {
    this.onTestSpeed();
    this.reloadKeySetup();
  }

  private async reloadKeySetup() {
    this.$scope.setup.busy = true;
    this.$scope.setup.storeError = false;
    this.$scope.setup.keyAvailable = false;
    this.$scope.setup.status = '';
    this.$scope.setup.progress = 'Loading cached keys';
    const loadTimeoutId = setTimeout(
      () => {
        this.$scope.setup.progress = 'Loading is taking too long. Close other tabs of this page';
      }, 2000);
    try {
      if (!this.keySetup) this.keySetup = await KeySetup.open(KEY_STORE_NAME);
      if ((await this.keySetup.getStoredKeys()) != null) {
        this.$scope.setup.keyAvailable = true;
      } else {
        this.$scope.setup.status = 'Setup key not configured';
      }
    } catch (err) {
      this.$scope.setup.storeError = true;
      this.$scope.setup.status = 'Error: ' + err;
    } finally {
      clearTimeout(loadTimeoutId);
      this.$scope.setup.busy = false;
    }
  }

  private reportProgress(rounds: number, setText: (text: string) => void) {
    let updateProgress = true;
    if (!this.speedTester.dataAvailable) throw new Error('speed not available');
    const eta = rounds / this.speedTester.iterationsPerSecond * 1000;
    const startTime = new Date().getTime();
    (function progressTick() {
      if (!updateProgress) return;
      const elapsedMillis = new Date().getTime() - startTime;
      const remainingSecs = Math.max(eta - elapsedMillis, 0) / 1000;
      setText(
        'Remaining ' + remainingSecs.toFixed(1) + 's of ' +
        (eta / 1000).toFixed(1) + 's');
      setTimeout(progressTick, 1000);
    })();
    return () => { updateProgress = false; };
  }

  private async onTestSpeed() {
    this.$scope.testing.busy = true;
    try {
      await this.speedTester.test();
    } finally {
      this.$scope.testing.busy = false;
    }
  }

  private async onDestroySetupKey() {
    this.$scope.setup.busy = true;
    this.$scope.setup.progress = '';
    try {
      if (!confirm('Are you sure you want to destroy the setup key?')) return;
      if (this.keySetup) {
        this.keySetup.close();
        this.keySetup = null;
        this.mainGenerator = null;
        this.$scope.main.passwordStatus = ENTER_PASSWORD_PLACEHOLDER;
      }
      this.$scope.setup.progress = 'Deleting setup key';
      const deleteTimeoutId = setTimeout(
        () => {
          this.$scope.setup.progress = 'Deleting is taking too long. Close other tabs of this page';
        }, 2000);
      try {
        await IndexedDBObjectMap.deleteMap(KEY_STORE_NAME);
      } finally {
        clearTimeout(deleteTimeoutId);
      }
    } finally {
      this.$scope.setup.busy = false;
    }
    await this.reloadKeySetup();
  }

  private async onSetSetupKey() {
    if (!this.keySetup) throw new Error('assertion error: this.keySetup not initialized');
    this.$scope.setup.busy = true;
    try {
      await this.keySetup.setKey(this.$scope.setup.keyHex);
      this.$scope.setup.keyHex = '';
    } finally {
      this.$scope.setup.busy = false;
    }
    await this.reloadKeySetup();
  }

  private async onCopyOutput() {
    const range = document.createRange();
    range.selectNode(document.querySelector('#output')!);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
  }

  private async onClearOutput() {
    this.$scope.main.output = '';
    this.$scope.main.clearMsg = '';
    this.lastComputeTime = null;
  }

  private async onCompute() {
    this.$scope.main.busy = true;
    await this.onClearOutput();
    const generator = new PasswordGen.generators[this.$scope.main.passwordScheme]!();
    const rounds = this.$scope.main.rounds;
    const stopProgressReport = this.reportProgress(rounds, s => this.$scope.main.progress = s);
    try {
      if (this.mainGenerator == null) {
        if (!this.keySetup) throw new Error('assertion error: keySetup not initialized');
        const storedKeys = await this.keySetup.getStoredKeys();
        if (!storedKeys) throw new Error('assertion error: keySetup keys not available');
        const [pbkdfKey, saltKey] = storedKeys
        this.mainGenerator = new MainGenerator(pbkdfKey, saltKey);
      }
      if (!this.mainGenerator.hasMasterKey || this.$scope.main.password != '') {
        if (this.$scope.main.password === '') {
          throw new Error('password gen password must be specified the first time');
        }
        await this.mainGenerator.updateMasterPassword(this.$scope.main.password);
        this.$scope.main.password = '';
        this.$scope.main.passwordStatus = 'Password cached in memory';
      }
      this.$scope.main.output = await this.mainGenerator.generatePassword(
        this.$scope.main.saltValue, rounds, generator);
      this.lastComputeTime = new Date();
    } finally {
      this.$scope.main.busy = false;
      stopProgressReport();
    }
  }

  private onTick() {
    if (this.lastComputeTime != null) {
      const millisSinceCompute =
        new Date().getTime() - this.lastComputeTime.getTime();
      const millisTillClear = AUTO_CLEAR_DELAY_MILLIS - millisSinceCompute;
      if (millisTillClear < 0) {
        this.onClearOutput();
      } else {
        this.$scope.main.clearMsg =
          `in ${(millisTillClear / 1000).toFixed(0)} s`;
      }
    }
  }
};
