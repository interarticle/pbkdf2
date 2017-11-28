export interface AsyncMap {
  put(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  close(): void;
  clear(): Promise<void>;
};

class ObjectMap implements AsyncMap {
  private db: IDBDatabase | null = null;

  constructor(private readonly name: string) { }

  static initDb(db: IDBDatabase) {
    db.createObjectStore('map', {keyPath: 'key'});
  }

  async open(): Promise<ObjectMap> {
    const dbr = indexedDB.open(this.name, 1);
    dbr.onupgradeneeded = () => { ObjectMap.initDb(dbr.result); };
    this.db = await wrapDBRequest(dbr);
    return this;
  }

  private startTransaction(mode: 'readwrite' | 'readonly'): [IDBObjectStore, Promise<void>] {
    if (!this.db) throw new Error('not opened');
    const txn = this.db.transaction('map', mode);
    const objectStore = txn.objectStore('map');
    const txnPromise = wrapDBTransaction(txn);
    return [objectStore, txnPromise];
  }

  async put(key: string, value: any) {
    const [objectStore, txnPromise] = this.startTransaction('readwrite');
    await wrapDBRequest(objectStore.put({
      key: key,
      value: value,
    }));
    await txnPromise;
  }

  async get(key: string): Promise<any> {
    const [objectStore, _] = this.startTransaction('readonly');
    const valueDict = await wrapDBRequest(objectStore.get(key));
    if (valueDict) {
      return valueDict.value || null;
    }
    return null;
  }

  close() {
    if (this.db) this.db.close();
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

function wrapDBRequest(dbRequest: IDBRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    dbRequest.onerror = () => reject(dbRequest.error);
    dbRequest.onsuccess = () => resolve(dbRequest.result);
  });
}
function wrapDBTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(new Error('transaction aborted'));
    transaction.oncomplete = () => resolve();
  });
}

export async function open(name: string): Promise<AsyncMap> {
  return new ObjectMap(name).open();
}

export function deleteMap(name: string): Promise<void> {
  return wrapDBRequest(indexedDB.deleteDatabase(name));
}
