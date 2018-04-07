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
        ow-bind-prop="placeholder=main.passwordStatus"
        ow-model="main.password">
  </label>

  <label class="input-group">
    <span class="label">Salt</span>
    <div class="flex">
      <input
          type="text"
          class="fixed-width fill"
          ow-model="main.salt.siteUser"
          placeholder="Enter the site domain name">
      <span class="fixed-width">/</span>
      <input
          type="number"
          class="fixed-width"
          ow-model="main.salt.year"
          style="width: 5em">
      <span class="fixed-width">/</span>
      <input
          type="number"
          class="fixed-width"
          ow-model="main.salt.revision"
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
    <select ow-model="main.roundsText">
      <option value="5000000">5000000</option>
    </select>
  </label>
  <label class="input-group">
    <span class="label">Password Scheme</span>
    <select ow-model="main.passwordScheme">
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

<script src="index.js"></script>
