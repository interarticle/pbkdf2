## PBKDF2

<style>
  h3 {
    margin-bottom: 16px;
  }
  .fixed-width {
    font-family: monospace;
  }
  .status-text {
    color: #999;
  }
  .input-list {
    display: flex;
    flex-direction: column;
    margin-bottom: 32px;
  }
  .input-list > * {
    margin-bottom: 8px;
    flex: 1;
  }
  .input-list > :last-child {
    margin-bottom: 0;
  }
  .input-group {
    display: flex;
    flex-direction: column;
  }
  .input-group > .label, .bottom-panel {
    color: #777;
    font-size: 13px;
  }
  .input-group > .label {
    margin-bottom: 2px;
  }
  .input-group > .bottom-panel {
    margin-top: 2px;
  }
  .flex {
    display: flex;
    flex-wrap: wrap;
  }
  .flex > * {
    margin-right: 4px;
    align-self: center;
  }
  .flex > :last-child {
    margin-right: 0;
  }
  .flex > .fill {
    flex: 1;
  }
  .output-box {
    padding: 4px;
    border-radius: 4px;
    border: solid 1px #aaa;
    background-color: #f5f5f5;
    margin-bottom: 4px;
    color: #000;
  }
  .output-box > .status-text {
    user-select: none;
  }
  input {
    border: 0 none;
    outline: none;
    border-bottom: 1px solid #777;
    padding: 4px;
  }
  input[disabled] {
    background-color: #eee;
  }
</style>

<button id="test-speed" ow-bind-prop="disabled=hashBusy">Retest PBKDF2 Speed</button>

### Setup Key

<div class="input-list">
  <label class="input-group">
    <span class="label">Setup Key (hex no space)</span>
    <input
        type="text"
        ow-bind-prop="placeholder=setup.keyStatus &#10; disabled=setupDisable"
        ow-model="setup.keyHex">
  </label>
  <div>
    <span
        ow-bind-text="!setup.busy ? setup.status : ''"
        class="status-text"></span>
    <span
        ow-bind-text="setup.busy ? setup.progress : ''"
        class="status-text"></span>
  </div>
  <div>
    <button
        id="destroy-setup-key"
        ow-bind-prop="disabled=hashBusy || (!setup.keyAvailable && !setup.storeError)">
      Destroy Key
    </button>
    <button
        id="set-setup-key"
        ow-bind-prop="disabled=hashBusy || setup.keyAvailable || setup.storeError">
      Set Key
    </button>
  </div>
</div>

### Password Gen

<div class="input-list">
  <label class="input-group">
    <span class="label">Password</span>
    <input
        type="password"
        ow-bind-prop="disabled=!setup.keyAvailable &#10; placeholder=main.passwordStatus"
        ow-model="main.password">
  </label>

  <label class="input-group">
    <span class="label">Salt</span>
    <div class="flex">
      <input
          type="text"
          class="fixed-width fill"
          ow-model="main.salt.siteUser"
          ow-bind-prop="disabled=!setup.keyAvailable"
          placeholder="Enter the site domain name">
      <span class="fixed-width">/</span>
      <input
          type="number"
          class="fixed-width"
          ow-model="main.salt.year"
          ow-bind-prop="disabled=!setup.keyAvailable" style="width: 5em">
      <span class="fixed-width">/</span>
      <input
          type="number"
          class="fixed-width"
          ow-model="main.salt.revision"
          ow-bind-prop="disabled=!setup.keyAvailable"
          min="0"
          style="width: 2em">
    </div>
    <span class="status-text bottom-panel">
      Salt value:
      <span class="fixed-width">
        "<span ow-bind-text="main.saltValue">/2018/0</span>"
      </span>
    </span>
  </label>
  <label class="input-group">
    <span class="label">Rounds</span>
    <select ow-model="main.roundsText" ow-bind-prop="disabled=!setup.keyAvailable">
      <option value="5000000">5000000</option>
    </select>
  </label>
  <label class="input-group">
    <span class="label">Password Scheme</span>
    <select ow-model="main.passwordScheme" ow-bind-prop="disabled=!setup.keyAvailable">
      <option value="CapitalNormalNum10">10 Char Alpha0</option>
      <option value="Num4">4-digit number</option>
      <option value="Num6">6-digit number</option>
    </select>
  </label>
  <div>HMAC-SHA512; ASCII enforced.</div>
  <div>
    <button
        id="compute"
        ow-bind-prop="disabled=hashBusy || mainDisable">
      Compute
    </button>
  </div>
  <div class="input-group">
    <span class="label">Output</span>
    <div class="fixed-width output-box">
      <span class="status-text" ow-bind-text="main.busy ? main.progress : ''"></span>
      <span id="output" ow-bind-text="main.output ? main.output : '\u00a0'"></span>
    </div>
    <div>
      <button id="copy-output" ow-bind-prop="disabled=main.output === ''">Copy</button>
      <button id="clear-output" ow-bind-prop="disabled=main.output === ''">
        Clear
        <span ow-bind-text="main.clearMsg"></span>
      </button>
    </div>
  </div>
</div>

<script>
"use strict";
/**
 * Super simple AMD module loader implementation that allows
 * typescript-generated concatenated js files to be loaded and run in a browser.
 *
 * This code does not implement any dependency resolution, but relies solely on
 * Typescript generating concatenated scripts in dependency-first order.
 *
 * Typescript currently allows two module systems to be concatenated: System
 * and AMD. AMD seems to generate more straightforward code (thus allowing
 * easier code audits and modification in the absence of a Typescript
 * compiler), and seems much simpler to implement.
 */
const define = (() => {
    const modules = {};
    function getModule(id) {
        const mod = modules[id];
        if (!mod)
            throw new Error(`${id} not found`);
        return mod;
    }
    function define(id, dependencies, factory) {
        let exports = {};
        const specials = {
            require: () => { throw new Error('require() is unsupported'); },
            exports: exports,
        };
        if (dependencies.indexOf('module') != -1) {
            throw new Error('the "module" dependency is unsupported');
        }
        const args = dependencies.map(arg => specials[arg] || getModule(arg));
        const returnedModule = factory(...args);
        if (dependencies.indexOf('exports') == -1) {
            exports = returnedModule;
        }
        modules[id] = exports;
    }
    define.getModule = getModule;
    return define;
})();
define("object_watcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function areObjectsSame(v1, v2) {
        return (v1 === v2
            || ((v1 !== v1) && (v2 !== v2)) // Handle the special case of NaN.
        );
    }
    class Watcher {
        constructor(exprFn, callbackFn) {
            this.exprFn = exprFn;
            this.callbackFn = callbackFn;
            this.lastValue = null;
            this.lastPaths = '';
        }
        recompute(target, proxy, firstRun = false) {
            let paths = '';
            const readProxy = new Proxy(target, new PathTrackerHandler('', null, path => paths += '|' + path));
            const newValue = this.exprFn(readProxy);
            if (firstRun || !areObjectsSame(this.lastValue, newValue)) {
                this.lastValue = newValue;
                this.callbackFn(newValue, proxy);
            }
            if (firstRun || this.lastPaths != paths) {
                const lastPaths = this.lastPaths;
                this.lastPaths = paths;
                return [lastPaths.split('|').slice(1), paths.split('|').slice(1)];
            }
        }
    }
    class PathTrackerHandler {
        constructor(path = '', onModify = null, onRead = null) {
            this.path = path;
            this.onModify = onModify;
            this.onRead = onRead;
            if (!onModify) {
                this.deleteProperty = undefined;
                this.set = undefined;
            }
        }
        get(target, prop) {
            const value = target[prop];
            const path = this.path + '.' + prop.toString();
            if (this.onRead)
                this.onRead(path);
            if (typeof value === 'object' && value !== null) {
                return new Proxy(value, new PathTrackerHandler(path, this.onModify, this.onRead));
            }
            return value;
        }
        set(target, prop, value) {
            target[prop] = value;
            const path = this.path + '.' + prop.toString();
            this.onModify(path);
            return true;
        }
        deleteProperty(target, prop) {
            delete target[prop];
            const path = this.path + '.' + prop.toString();
            this.onModify(path);
            return true;
        }
    }
    const ALL_PATHS = '';
    function readPath(obj, fieldNames) {
        return fieldNames.reduce((o, fieldName) => o[fieldName], obj);
    }
    class ProxyHandler extends PathTrackerHandler {
        constructor(target) {
            super('', path => this.recompute(path));
            this.target = target;
            // empty path (no dot) means everything.
            this.pathToWatchers = {};
        }
        watch(exprFn, callbackFn) {
            if (typeof exprFn === 'string') {
                const path = exprFn.split('.');
                exprFn = p => readPath(p, path);
            }
            const watcher = new Watcher(exprFn, callbackFn);
            this.computeAndStoreWatcher(watcher, true);
        }
        get(target, prop) {
            if (target === this.target && prop === '$watch') {
                return this.watch.bind(this);
            }
            return super.get(target, prop);
        }
        set(target, prop, value) {
            if (target === this.target && prop === '$watch') {
                throw new Error('cannot change $watch');
            }
            return super.set(target, prop, value);
        }
        deleteProperty(target, prop) {
            if (target === this.target && prop === '$watch') {
                throw new Error('cannot delete $watch');
            }
            return super.deleteProperty(target, prop);
        }
        recompute(path) {
            for (const p of [path, ALL_PATHS]) {
                const matchingSet = this.pathToWatchers[p];
                if (matchingSet) {
                    for (const watcher of matchingSet) {
                        this.computeAndStoreWatcher(watcher);
                    }
                }
            }
        }
        computeAndStoreWatcher(watcher, firstRun = false) {
            const tuple = watcher.recompute(this.target, new Proxy(this.target, this), firstRun);
            if (!tuple)
                return;
            let [lastPaths, paths] = tuple;
            if (lastPaths.length == 0)
                lastPaths = [ALL_PATHS];
            if (paths.length == 0)
                paths = [ALL_PATHS];
            for (const path of new Set(lastPaths)) {
                const set = this.pathToWatchers[path];
                if (set) {
                    set.delete(watcher);
                    if (set.size == 0)
                        delete this.pathToWatchers[path];
                }
            }
            for (const path of paths) {
                let set = this.pathToWatchers[path];
                if (!set) {
                    set = new Set();
                    this.pathToWatchers[path] = set;
                }
                set.add(watcher);
            }
        }
    }
    function wrap(obj) {
        // @SuppressWarnings("unchecked"): $watch implemented by ProxyHandler.
        return (new Proxy(obj, new ProxyHandler(obj)));
    }
    exports.wrap = wrap;
    function makeScopeEvalFunction(expr) {
        // Use Function instead of eval to bypass use strict checking for the with
        // clause.  https://stackoverflow.com/questions/6020178.
        return new Function(`return (function () { with (this) { return ${expr}; } });`)();
    }
    function bindElements(rootElement, obj) {
        for (const elem of rootElement.querySelectorAll('*[ow-bind-text]')) {
            if (!(elem instanceof HTMLElement))
                continue;
            const bindExpr = elem.getAttribute('ow-bind-text');
            if (!bindExpr)
                continue;
            const exprFn = makeScopeEvalFunction(bindExpr);
            obj.$watch(s => exprFn.apply(s), v => elem.textContent = v);
        }
        for (const elem of rootElement.querySelectorAll('*[ow-model]')) {
            if (elem.value === undefined)
                continue;
            const input = elem;
            const modelExpr = elem.getAttribute('ow-model');
            if (!modelExpr)
                continue;
            const path = modelExpr.split('.');
            obj.$watch(scope => readPath(scope, path), v => input.value = v);
            input.addEventListener('input', () => {
                readPath(obj, path.slice(0, -1))[path[path.length - 1]] = input.value;
            });
        }
        for (const elem of rootElement.querySelectorAll('*[ow-bind-prop]')) {
            const assignment = elem.getAttribute('ow-bind-prop');
            if (!assignment)
                continue;
            for (const line of assignment.split('\n')) {
                const match = /\s*([^\s=]+?)\s*=\s*(.+)/.exec(line);
                if (!match)
                    throw new Error(line + ' has incorrect format');
                const [_, propName, value] = match;
                const exprFn = makeScopeEvalFunction(value);
                obj.$watch(s => exprFn.apply(s), v => elem[propName] = v);
            }
        }
    }
    exports.bindElements = bindElements;
});
define("indexed_db_object_map", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    class ObjectMap {
        constructor(name) {
            this.name = name;
            this.db = null;
        }
        static initDb(db) {
            db.createObjectStore('map', { keyPath: 'key' });
        }
        async open() {
            const dbr = indexedDB.open(this.name, 1);
            dbr.onupgradeneeded = () => { ObjectMap.initDb(dbr.result); };
            this.db = await wrapDBRequest(dbr);
            return this;
        }
        startTransaction(mode) {
            if (!this.db)
                throw new Error('not opened');
            const txn = this.db.transaction('map', mode);
            const objectStore = txn.objectStore('map');
            const txnPromise = wrapDBTransaction(txn);
            return [objectStore, txnPromise];
        }
        async put(key, value) {
            const [objectStore, txnPromise] = this.startTransaction('readwrite');
            await wrapDBRequest(objectStore.put({
                key: key,
                value: value,
            }));
            await txnPromise;
        }
        async get(key) {
            const [objectStore, _] = this.startTransaction('readonly');
            const valueDict = await wrapDBRequest(objectStore.get(key));
            if (valueDict) {
                return valueDict.value || null;
            }
            return null;
        }
        close() {
            if (this.db)
                this.db.close();
        }
        _deleteDb() {
            return wrapDBRequest(indexedDB.deleteDatabase(this.name));
        }
        async clear() {
            this.close();
            await this._deleteDb();
            await this.open();
        }
    }
    function wrapDBRequest(dbRequest) {
        return new Promise((resolve, reject) => {
            dbRequest.onerror = () => reject(dbRequest.error);
            dbRequest.onsuccess = () => resolve(dbRequest.result);
        });
    }
    function wrapDBTransaction(transaction) {
        return new Promise((resolve, reject) => {
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(new Error('transaction aborted'));
            transaction.oncomplete = () => resolve();
        });
    }
    async function open(name) {
        return new ObjectMap(name).open();
    }
    exports.open = open;
    function deleteMap(name) {
        return wrapDBRequest(indexedDB.deleteDatabase(name));
    }
    exports.deleteMap = deleteMap;
});
define("crypto/speed_tester", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Pbkdf2SpeedTester {
        constructor() {
            this.dummyKeyBytes = new Uint8Array(128);
            this.ips = null;
        }
        get dataAvailable() {
            return this.ips != null;
        }
        get iterationsPerSecond() {
            if (this.ips == null)
                throw new Error('test data not available');
            return this.ips;
        }
        async test() {
            const key = await crypto.subtle.importKey('raw', this.dummyKeyBytes, { name: 'PBKDF2' }, false, ['deriveBits']);
            let iterations = 0;
            let elapsedMillis = 0;
            const saltBytes = new Uint8Array(64);
            for (iterations = 10000; iterations < (1 << 30) && iterations > 0; iterations *= 10) {
                crypto.getRandomValues(saltBytes);
                const start = new Date().getTime();
                await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-512' }, key, 512);
                elapsedMillis = new Date().getTime() - start;
                if (elapsedMillis > 300)
                    break;
            }
            this.ips = iterations / elapsedMillis * 1000;
        }
    }
    exports.Pbkdf2SpeedTester = Pbkdf2SpeedTester;
});
/**
 * Multi-character password complexity rules validator.
 *
 * While these classes can be used to implement chararcter presence complexity rules, the fact that
 * the rules are applied one character at a time may cause the resulting passwords to be biased.
 *
 * These rules are used to ensure that passwords generated conform to stupid complexity rules
 * enforced by stupid websites. While I do not personally agree with these rules, they're
 * unfortunately an unavoidable part of life.
 */
define("password/complexity", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AbstractComplexityRule {
        computeAllowedChars(charSet, previousChars) {
            const allowedChars = [];
            const processedPreviousChars = this.processPreviousChars(previousChars);
            for (const c of charSet) {
                if (!this.isCharBlacklisted(c, processedPreviousChars)) {
                    allowedChars.push(c);
                }
                else {
                    console.log('Excluding char', c, 'in partial password sequence', previousChars);
                }
            }
            return allowedChars;
        }
    }
    exports.AbstractComplexityRule = AbstractComplexityRule;
    class RuleNoRepeatingCI extends AbstractComplexityRule {
        constructor(numRepeating) {
            super();
            this.numRepeating = numRepeating;
        }
        processPreviousChars(previousChars) {
            const candidateSet = previousChars.slice(-(this.numRepeating - 1)).map(c => c.toLowerCase());
            if (candidateSet.length < this.numRepeating - 1) {
                return null;
            }
            if (new Set(candidateSet).size != 1) {
                return null;
            }
            return candidateSet[0];
        }
        isCharBlacklisted(c, processedPreviousChars) {
            return processedPreviousChars != null && c.toLowerCase() === processedPreviousChars;
        }
    }
    exports.RuleNoRepeatingCI = RuleNoRepeatingCI;
    // Sequential as defined by ASCII-numerical value sequence. This works in sets of a-z, A-Z, 0-9, but
    // not across.
    class RuleNoSequentialCI extends AbstractComplexityRule {
        constructor(numSequential) {
            super();
            this.numSequential = numSequential;
        }
        processPreviousChars(previousChars) {
            const candidateCodes = previousChars
                .slice(-(this.numSequential - 1))
                .map(c => {
                if (c.length > 1)
                    throw new Error(`multi-char sequence ${c} not supported`);
                const codePoint = c.toLowerCase().codePointAt(0);
                if (codePoint === undefined)
                    throw new Error('empty char sequence not supported');
                return codePoint;
            });
            if (candidateCodes.length < this.numSequential - 1) {
                return null;
            }
            const codeDifferences = [];
            for (let i = 1; i < candidateCodes.length; i++) {
                codeDifferences.push(candidateCodes[i] - candidateCodes[i - 1]);
            }
            if (codeDifferences.length === 0) {
                return new Set([candidateCodes[0] + 1, candidateCodes[0] - 1]);
            }
            else if (codeDifferences.every(n => n === 1)) {
                return new Set([candidateCodes[candidateCodes.length - 1] + 1]);
            }
            else if (codeDifferences.every(n => n === -1)) {
                return new Set([candidateCodes[candidateCodes.length - 1] - 1]);
            }
            else {
                return null;
            }
        }
        isCharBlacklisted(c, processedPreviousChars) {
            return (processedPreviousChars != null
                && processedPreviousChars.has(c.toLowerCase().codePointAt(0)));
        }
    }
    exports.RuleNoSequentialCI = RuleNoSequentialCI;
});
define("password/generator", ["require", "exports", "password/complexity"], function (require, exports, Complexity) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function selectChar(charSet, randomByte) {
        return charSet[randomByte % charSet.length];
    }
    function makeStringCharSet(s) {
        return s.split('');
    }
    exports.charSets = {
        lowerAlpha: makeStringCharSet('abcdefghijklmnopqrstuvwxyz'),
        upperAlpha: makeStringCharSet('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
        numbers: makeStringCharSet('0123456789'),
    };
    class AbstractPasswordGenerator {
        constructor() {
            this.complexityRules = [];
        }
        async generate(key) {
            const numChars = this.numChars;
            const randomBytes = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(0), iterations: 1, hash: 'SHA-512' }, key, 8 * numChars));
            const generatedChars = [];
            for (let i = 0; i < numChars; i++) {
                let charSet = this.getCharSet(i);
                for (const rule of this.complexityRules) {
                    charSet = rule.computeAllowedChars(charSet, generatedChars);
                }
                generatedChars.push(selectChar(charSet, randomBytes[i]));
            }
            return generatedChars.join('');
        }
    }
    exports.AbstractPasswordGenerator = AbstractPasswordGenerator;
    exports.generators = {
        CapitalNormalNum10: class extends AbstractPasswordGenerator {
            constructor() {
                super(...arguments);
                this.complexityRules = [
                    new Complexity.RuleNoSequentialCI(3),
                    new Complexity.RuleNoRepeatingCI(3),
                ];
                this.numChars = 10;
            }
            getCharSet(index) {
                if (index == 0) {
                    return exports.charSets.upperAlpha;
                }
                else if (index < 9) {
                    return exports.charSets.lowerAlpha;
                }
                else {
                    return exports.charSets.numbers;
                }
            }
        },
        Num4: class extends AbstractPasswordGenerator {
            constructor() {
                super(...arguments);
                this.complexityRules = [
                    new Complexity.RuleNoRepeatingCI(2),
                    new Complexity.RuleNoSequentialCI(3),
                ];
                this.numChars = 4;
            }
            getCharSet(index) {
                return exports.charSets.numbers;
            }
        },
        Num6: class extends AbstractPasswordGenerator {
            constructor() {
                super(...arguments);
                this.complexityRules = [
                    new Complexity.RuleNoRepeatingCI(3),
                    new Complexity.RuleNoSequentialCI(3),
                ];
                this.numChars = 6;
            }
            getCharSet(index) {
                return exports.charSets.numbers;
            }
        },
    };
});
define("binutil", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Binary utilities */
    const minPrintable = 0x20;
    const maxPrintable = 0x7e;
    function stringToBytesCheckingAscii(str) {
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
    exports.stringToBytesCheckingAscii = stringToBytesCheckingAscii;
    function parseHexString(hex) {
        if ((hex.length % 2) != 0) {
            throw new Error('Hex string should have even length');
        }
        const result = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            const byteHex = hex.substring(i, i + 2);
            result[i / 2] = parseInt(byteHex, 16);
        }
        return result;
    }
    exports.parseHexString = parseHexString;
});
define("crypto/key_setup", ["require", "exports", "indexed_db_object_map", "binutil"], function (require, exports, ObjectMap, binutil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeySetup {
        constructor(keyStore) {
            this.keyStore = keyStore;
        }
        static async open(mapName) {
            return new KeySetup(await ObjectMap.open(mapName));
        }
        async getStoredKeys() {
            const pbkdfKey = await this.keyStore.get('pbkdf-key');
            const saltKey = await this.keyStore.get('salt-key');
            if (!pbkdfKey && !saltKey)
                return null;
            if (!pbkdfKey)
                throw new Error('PBKDF2 key missing');
            if (!saltKey)
                throw new Error('Salt key missing');
            if (saltKey.algorithm.name != 'HMAC' || saltKey.algorithm.hash.name != 'SHA-512') {
                throw new Error('Invalid salt key algorithm: ' + saltKey.algorithm);
            }
            await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new Uint8Array(0), iterations: 1, hash: 'SHA-512' }, pbkdfKey, { name: 'HMAC', hash: 'SHA-512', length: 1024 }, false, ['sign']);
            const signature = await crypto.subtle.sign('HMAC', saltKey, new Uint8Array(10));
            if (new Uint8Array(signature).length != 64) {
                throw new Error('HMAC key has unexpected hash length.');
            }
            return [pbkdfKey, saltKey];
        }
        async setKey(setupKeyHex) {
            const keyBytes = binutil_1.parseHexString(setupKeyHex);
            if (keyBytes.length != 64) {
                throw new Error(`Setup key has invalid length ${keyBytes.length} != 64`);
            }
            const pbkdfKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'PBKDF2' }, false, ['deriveKey']);
            const saltKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
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
    exports.KeySetup = KeySetup;
});
define("crypto/main_generator", ["require", "exports", "binutil"], function (require, exports, binutil_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MainGenerator {
        constructor(pbkdfKey, saltKey) {
            this.pbkdfKey = pbkdfKey;
            this.saltKey = saltKey;
            this.masterKey = null;
        }
        async updateMasterPassword(password) {
            const passwordBytes = binutil_2.stringToBytesCheckingAscii(password);
            const masterSign = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: passwordBytes, iterations: 1, hash: 'SHA-512' }, this.pbkdfKey, { name: 'HMAC', hash: 'SHA-512', length: 1024 }, true, ['sign']);
            const masterBytes = await crypto.subtle.exportKey('raw', masterSign);
            this.masterKey = await crypto.subtle.importKey('raw', masterBytes, { name: 'PBKDF2' }, false, ['deriveBits']);
        }
        get hasMasterKey() {
            return this.masterKey != null;
        }
        async generatePassword(salt, rounds, passwordGen) {
            if (!this.masterKey)
                throw new Error('master key not available');
            const saltBytes = binutil_2.stringToBytesCheckingAscii(salt);
            const saltSigned = await crypto.subtle.sign('HMAC', this.saltKey, saltBytes);
            const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltSigned, iterations: rounds, hash: 'SHA-512' }, this.masterKey, 512);
            return await passwordGen.generate(await crypto.subtle.importKey('raw', derivedBits, { name: 'PBKDF2' }, false, ['deriveBits']));
        }
    }
    exports.MainGenerator = MainGenerator;
});
define("main", ["require", "exports", "object_watcher", "indexed_db_object_map", "crypto/speed_tester", "password/generator", "crypto/key_setup", "crypto/main_generator"], function (require, exports, ObjectWatcher, IndexedDBObjectMap, speed_tester_1, PasswordGen, key_setup_1, main_generator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const KEY_STORE_NAME = 'setup-key-store';
    const AUTO_CLEAR_DELAY_MILLIS = 60000;
    const ENTER_PASSWORD_PLACEHOLDER = 'Enter your master password';
    class DefaultScope {
        constructor() {
            this.main = {
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
            this.testing = {
                busy: false,
            };
            this.setup = {
                keyHex: '',
                status: '',
                busy: false,
                keyAvailable: false,
                storeError: false,
                keyStatus: '',
                progress: '',
            };
            this.hashBusy = false;
            this.mainDisable = false;
            this.setupDisable = false;
        }
    }
    class MainController {
        constructor() {
            this.$scope = ObjectWatcher.wrap(new DefaultScope());
            this.speedTester = new speed_tester_1.Pbkdf2SpeedTester();
            this.keySetup = null;
            this.mainGenerator = null;
            this.lastComputeTime = null;
            this.setupScope();
        }
        setupScope() {
            this.$scope.$watch('main.roundsText', (v, s) => s.main.rounds = parseInt(v));
            this.$scope.$watch(s => s.main.busy || s.testing.busy || s.setup.busy, (v, s) => s.hashBusy = v);
            this.$scope.$watch(s => s.main.busy || !s.setup.keyAvailable, (v, s) => s.mainDisable = v);
            this.$scope.$watch(s => s.setup.busy || s.setup.keyAvailable, (v, s) => s.setupDisable = v);
            this.$scope.$watch('setup.keyAvailable', (v, s) => {
                if (v) {
                    s.setup.keyStatus = 'Click "Destroy Key" to reset key';
                }
                else {
                    s.setup.keyStatus = 'Enter key and click set key to store';
                }
            });
            this.$scope.$watch('main.salt.siteUser', (v, s) => s.main.salt.siteUser = v.toLowerCase());
            this.$scope.$watch(s => `${s.main.salt.siteUser}/${s.main.salt.year}/${s.main.salt.revision}`, (v, s) => s.main.saltValue = v);
        }
        bootstrap() {
            this.bindElements();
            this.start();
        }
        bindElements() {
            ObjectWatcher.bindElements(document.body, this.$scope);
            document.querySelector('#test-speed')
                .addEventListener('click', this.wrapErrorsAndBind(this.onTestSpeed));
            document.querySelector('#destroy-setup-key')
                .addEventListener('click', this.wrapErrorsAndBind(this.onDestroySetupKey));
            document.querySelector('#set-setup-key')
                .addEventListener('click', this.wrapErrorsAndBind(this.onSetSetupKey));
            document.querySelector('#copy-output')
                .addEventListener('click', this.wrapErrorsAndBind(this.onCopyOutput));
            document.querySelector('#compute')
                .addEventListener('click', this.wrapErrorsAndBind(this.onCompute));
            document.querySelector('#clear-output')
                .addEventListener('click', this.wrapErrorsAndBind(this.onClearOutput));
            setInterval(this.onTick.bind(this), 1000);
        }
        wrapErrorsAndBind(fn) {
            const bound = fn.bind(this);
            return async () => {
                try {
                    await bound();
                }
                catch (err) {
                    alert('Error: ' + err);
                    console.error(err);
                }
            };
        }
        start() {
            this.onTestSpeed();
            this.reloadKeySetup();
        }
        async reloadKeySetup() {
            this.$scope.setup.busy = true;
            this.$scope.setup.storeError = false;
            this.$scope.setup.keyAvailable = false;
            this.$scope.setup.status = '';
            this.$scope.setup.progress = 'Loading cached keys';
            const loadTimeoutId = setTimeout(() => {
                this.$scope.setup.progress = 'Loading is taking too long. Close other tabs of this page';
            }, 2000);
            try {
                if (!this.keySetup)
                    this.keySetup = await key_setup_1.KeySetup.open(KEY_STORE_NAME);
                if ((await this.keySetup.getStoredKeys()) != null) {
                    this.$scope.setup.keyAvailable = true;
                }
                else {
                    this.$scope.setup.status = 'Setup key not configured';
                }
            }
            catch (err) {
                this.$scope.setup.storeError = true;
                this.$scope.setup.status = 'Error: ' + err;
            }
            finally {
                clearTimeout(loadTimeoutId);
                this.$scope.setup.busy = false;
            }
        }
        reportProgress(rounds, setText) {
            let updateProgress = true;
            if (!this.speedTester.dataAvailable)
                throw new Error('speed not available');
            const eta = rounds / this.speedTester.iterationsPerSecond * 1000;
            const startTime = new Date().getTime();
            (function progressTick() {
                if (!updateProgress)
                    return;
                const elapsedMillis = new Date().getTime() - startTime;
                const remainingSecs = Math.max(eta - elapsedMillis, 0) / 1000;
                setText('Remaining ' + remainingSecs.toFixed(1) + 's of ' +
                    (eta / 1000).toFixed(1) + 's');
                setTimeout(progressTick, 1000);
            })();
            return () => { updateProgress = false; };
        }
        async onTestSpeed() {
            this.$scope.testing.busy = true;
            try {
                await this.speedTester.test();
            }
            finally {
                this.$scope.testing.busy = false;
            }
        }
        async onDestroySetupKey() {
            this.$scope.setup.busy = true;
            this.$scope.setup.progress = '';
            try {
                if (!confirm('Are you sure you want to destroy the setup key?'))
                    return;
                if (this.keySetup) {
                    this.keySetup.close();
                    this.keySetup = null;
                    this.mainGenerator = null;
                    this.$scope.main.passwordStatus = ENTER_PASSWORD_PLACEHOLDER;
                }
                this.$scope.setup.progress = 'Deleting setup key';
                const deleteTimeoutId = setTimeout(() => {
                    this.$scope.setup.progress = 'Deleting is taking too long. Close other tabs of this page';
                }, 2000);
                try {
                    await IndexedDBObjectMap.deleteMap(KEY_STORE_NAME);
                }
                finally {
                    clearTimeout(deleteTimeoutId);
                }
            }
            finally {
                this.$scope.setup.busy = false;
            }
            await this.reloadKeySetup();
        }
        async onSetSetupKey() {
            if (!this.keySetup)
                throw new Error('assertion error: this.keySetup not initialized');
            this.$scope.setup.busy = true;
            try {
                await this.keySetup.setKey(this.$scope.setup.keyHex);
                this.$scope.setup.keyHex = '';
            }
            finally {
                this.$scope.setup.busy = false;
            }
            await this.reloadKeySetup();
        }
        async onCopyOutput() {
            const range = document.createRange();
            range.selectNode(document.querySelector('#output'));
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
        }
        async onClearOutput() {
            this.$scope.main.output = '';
            this.$scope.main.clearMsg = '';
            window.getSelection().removeAllRanges();
            this.lastComputeTime = null;
        }
        async onCompute() {
            this.$scope.main.busy = true;
            await this.onClearOutput();
            const generator = new PasswordGen.generators[this.$scope.main.passwordScheme]();
            const rounds = this.$scope.main.rounds;
            const stopProgressReport = this.reportProgress(rounds, s => this.$scope.main.progress = s);
            try {
                if (this.mainGenerator == null) {
                    if (!this.keySetup)
                        throw new Error('assertion error: keySetup not initialized');
                    const storedKeys = await this.keySetup.getStoredKeys();
                    if (!storedKeys)
                        throw new Error('assertion error: keySetup keys not available');
                    const [pbkdfKey, saltKey] = storedKeys;
                    this.mainGenerator = new main_generator_1.MainGenerator(pbkdfKey, saltKey);
                }
                if (!this.mainGenerator.hasMasterKey || this.$scope.main.password != '') {
                    if (this.$scope.main.password === '') {
                        throw new Error('password gen password must be specified the first time');
                    }
                    await this.mainGenerator.updateMasterPassword(this.$scope.main.password);
                    this.$scope.main.password = '';
                    this.$scope.main.passwordStatus = 'Password cached in memory';
                }
                this.$scope.main.output = await this.mainGenerator.generatePassword(this.$scope.main.saltValue, rounds, generator);
                this.lastComputeTime = new Date();
            }
            finally {
                this.$scope.main.busy = false;
                stopProgressReport();
            }
        }
        onTick() {
            if (this.lastComputeTime != null) {
                const millisSinceCompute = new Date().getTime() - this.lastComputeTime.getTime();
                const millisTillClear = AUTO_CLEAR_DELAY_MILLIS - millisSinceCompute;
                if (millisTillClear < 0) {
                    this.onClearOutput();
                }
                else {
                    this.$scope.main.clearMsg =
                        `in ${(millisTillClear / 1000).toFixed(0)} s`;
                }
            }
        }
    }
    exports.MainController = MainController;
    ;
});
define("index", ["require", "exports", "main"], function (require, exports, main_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function init() {
        try {
            await new main_1.MainController().bootstrap();
        }
        catch (err) {
            alert(`Initialization failed: ${err}`);
        }
    }
    init();
});
</script>
