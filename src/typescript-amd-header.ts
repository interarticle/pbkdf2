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
  const modules: { [id: string]: object | undefined } = {};
  function getModule(id: string): object {
    const mod = modules[id];
    if (!mod) throw new Error(`${id} not found`);
    return mod;
  }
  function define(id: string, dependencies: string[], factory: Function): void {
    let exports: object = {};
    const specials: { [arg: string]: object } = {
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
  (<any>define).getModule = getModule;

  return define;
})();
