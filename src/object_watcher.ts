export type ValueFunction<T, O> = (obj: T) => O;
export type ProcessFunction<T, O> = (value: O, obj: T) => void;

function areObjectsSame(v1: any, v2: any) {
  return (
    v1 === v2
    || ((v1 !== v1) && (v2 !== v2))  // Handle the special case of NaN.
  );
}

class Watcher<T extends object, O> {
  private lastValue: O | null = null;
  private lastPaths: string = '';

  constructor(
    private readonly exprFn: ValueFunction<T, O>,
    private readonly callbackFn: ProcessFunction<T, O>) { }

  recompute(target: T, proxy: T, firstRun=false) {
    let paths = '';
    const readProxy = new Proxy(
      target, new PathTrackerHandler('', null, path => paths += '|' + path));
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

type TrackerCallback = ((path: string) => void) | null;

class PathTrackerHandler<T extends object> {
  constructor(
      private readonly path='',
      private readonly onModify: TrackerCallback=null,
      private readonly onRead: TrackerCallback=null) {
    if (!onModify) {
      (<any>this).deleteProperty = undefined;
      (<any>this).set = undefined;
    }
  }

  get(target: T, prop: string): any {
    const value: any = (<any>target)[prop];
    const path = this.path + '.' + prop.toString();
    if (this.onRead) this.onRead(path);
    if (typeof value === 'object' && value !== null) {
      return new Proxy(
        value, new PathTrackerHandler(path, this.onModify, this.onRead));
    }
    return value;
  }
  set(target: T, prop: string, value: any): boolean {
    (<any>target)[prop] = value;
    const path = this.path + '.' + prop.toString();
    this.onModify!(path);
    return true;
  }
  deleteProperty(target: T, prop: string): boolean {
    delete (<any>target)[prop];
    const path = this.path + '.' + prop.toString();
    this.onModify!(path);
    return true;
  }
}

const ALL_PATHS = '';

function readPath(obj: any, fieldNames: string[]): any {
  return fieldNames.reduce((o, fieldName) => o[fieldName], obj);
}

interface Watchable<T> {
  $watch<O>(
    exprFn: ValueFunction<T, O> | string,
    callbackFn: ProcessFunction<T, O>): void;
}

class ProxyHandler<T extends object> extends PathTrackerHandler<T> {
  // empty path (no dot) means everything.
  private pathToWatchers: { [path: string]: Set<Watcher<T, any>> | undefined }
    = {};

  constructor(private readonly target: T) {
    super('', path => this.recompute(path));
  }
  private watch<O>(
      exprFn: ValueFunction<T, O> | string,
      callbackFn: ProcessFunction<T, O>): void {
    if (typeof exprFn === 'string') {
      const path = exprFn.split('.');
      exprFn = p => readPath(p, path);
    }
    const watcher = new Watcher(exprFn, callbackFn);
    this.computeAndStoreWatcher(watcher, true);
  }
  get(target: T, prop: string): any {
    if (target === this.target && prop === '$watch') {
      return this.watch.bind(this);
    }
    return super.get(target, prop);
  }
  set(target: T, prop: string, value: any): boolean {
    if (target === this.target && prop === '$watch') {
      throw new Error('cannot change $watch');
    }
    return super.set(target, prop, value);
  }
  deleteProperty(target: T, prop: string): boolean {
    if (target === this.target && prop === '$watch') {
      throw new Error('cannot delete $watch');
    }
    return super.deleteProperty(target, prop);
  }
  private recompute(path: string) {
    for (const p of [path, ALL_PATHS]) {
      const matchingSet = this.pathToWatchers[p];
      if (matchingSet) {
        for (const watcher of matchingSet) {
          this.computeAndStoreWatcher(watcher);
        }
      }
    }
  }
  private computeAndStoreWatcher(watcher: Watcher<T, any>, firstRun=false){
    const tuple = watcher.recompute(
      this.target, new Proxy(this.target, this), firstRun);
    if (!tuple) return;
    let [lastPaths, paths] = tuple;
    if (lastPaths.length == 0) lastPaths = [ALL_PATHS];
    if (paths.length == 0) paths = [ALL_PATHS];
    for (const path of new Set(lastPaths)) {
      const set = this.pathToWatchers[path];
      if (set) {
        set.delete(watcher);
        if (set.size == 0) delete this.pathToWatchers[path];
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

export type WatchableProxy<T> = T & Watchable<T>;

export function wrap<T extends object>(obj: T): WatchableProxy<T> {
  // @SuppressWarnings("unchecked"): $watch implemented by ProxyHandler.
  return <any>(new Proxy(obj, new ProxyHandler<T>(obj)));
}

function makeScopeEvalFunction(expr: string): () => any {
  // Use Function instead of eval to bypass use strict checking for the with
  // clause.  https://stackoverflow.com/questions/6020178.
  return new Function(
    `return (function () { with (this) { return ${expr}; } });`
  )();
}

export function bindElements(rootElement: HTMLElement, obj: Watchable<any>) {
  for (const elem of rootElement.querySelectorAll('*[ow-bind-text]')) {
    if (!(elem instanceof HTMLElement)) continue;
    const bindExpr = elem.getAttribute('ow-bind-text');
    if (!bindExpr) continue;
    const exprFn = makeScopeEvalFunction(bindExpr);
    obj.$watch(s => exprFn.apply(s), v => elem.textContent = v);
  }
  for (const elem of rootElement.querySelectorAll('*[ow-model]')) {
    if ((<any>elem).value === undefined) continue;
    const input = <HTMLInputElement> elem;
    const modelExpr = elem.getAttribute('ow-model');
    if (!modelExpr) continue;
    const path = modelExpr.split('.');
    obj.$watch(scope => readPath(scope, path), v => input.value = v);
    input.addEventListener('input', () => {
      readPath(obj, path.slice(0, -1))[path[path.length - 1]] = input.value;
    });
  }
  for (const elem of rootElement.querySelectorAll('*[ow-bind-prop]')) {
    const assignment = elem.getAttribute('ow-bind-prop');
    if (!assignment) continue;
    for (const line of assignment.split('\n')) {
      const match = /\s*([^\s=]+?)\s*=\s*(.+)/.exec(line);
      if (!match) throw new Error(line + ' has incorrect format');
      const [_, propName, value] = match;
      const exprFn = makeScopeEvalFunction(value);
      obj.$watch(s => exprFn.apply(s), v => (<any>elem)[propName] = v);
    }
  }
}
