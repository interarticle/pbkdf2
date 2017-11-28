## PBKDF2

<style>
  input.lower-input-text {
    text-transform: lowercase;
  }
  .fixed-width {
    font-family: monospace;
  }
  .status-text {
    color: #999;
  }
</style>

<button id="test-speed" ow-bind-prop="disabled=hashBusy">Retest PBKDF2 Speed</button>

### Setup Key

<label>
  Setup Key (hex no space):
  <input type="text"
    ow-bind-prop="placeholder=setup.keyStatus &#10; disabled=setupDisable"
    ow-model="setup.keyHex">
</label>

HMAC-SHA512; ASCII enforced. 100000000 rounds.

<span ow-bind-text="!setup.busy ? setup.status : ''" class="status-text"></span>
<span ow-bind-text="setup.busy ? setup.progress : ''" class="status-text"></span>

<button id="destroy-setup-key" ow-bind-prop="disabled=hashBusy || (!setup.keyAvailable && !setup.storeError)">Destroy Key</button>
<button id="set-setup-key" ow-bind-prop="disabled=hashBusy || setup.keyAvailable || setup.storeError">Set Key</button>

### Password Gen

<label>
  Password:
  <input type="password"
    ow-bind-prop="disabled=mainDisable &#10; placeholder=main.passwordStatus"
    ow-model="main.password"/>
</label>

<p>
  <div>
    <label>
      Salt:
      <input type="text" class="lower-input-text fixed-width" ow-model="main.salt.siteUser" ow-bind-prop="disabled=mainDisable" />
      /
      <input type="number" class="lower-input-text fixed-width" ow-model="main.salt.year" ow-bind-prop="disabled=mainDisable" style="width: 5em" />
      /
      <input type="number" class="lower-input-text fixed-width" ow-model="main.salt.revision" ow-bind-prop="disabled=mainDisable" min="0" style="width: 2em" />
    </label>
  </div>
  <div>
    <span class="status-text">
      Salt value:
      <span class="fixed-width">
        "<span ow-bind-text="main.saltValue"></span>"
      </span>
    </span>
  </div>
</p>

<label>
  Rounds:
  <select ow-model="main.roundsText" ow-bind-prop="disabled=mainDisable">
    <option value="5000000">5000000</option>
  </select>
</label>

<label>
  Password Scheme:
  <select ow-model="main.passwordScheme" ow-bind-prop="disabled=mainDisable">
    <option value="CapitalNormalNum10">10 Char Alpha0</option>
    <option value="Num4">4-digit number</option>
    <option value="Num6">6-digit number</option>
  </select>
</label>

HMAC-SHA512; ASCII enforced.

<button id="compute" ow-bind-prop="disabled=hashBusy || mainDisable">Compute</button>

Output:
<span class="status-text" ow-bind-text="main.busy ? main.progress : ''"></span>
<span id="output" class="fixed-width" ow-bind-text="main.output"></span>
<button id="copy-output" ow-bind-prop="disabled=main.output === ''">Copy</button>
<button id="clear-output" ow-bind-prop="disabled=main.output === ''">Clear</button>

<script src="index.js"></script>
