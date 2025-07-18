import { inject, Injectable } from '@angular/core';
import { AppSettings } from '@app/common/models/app-settings.model';
import {Dexie} from 'dexie';
import * as _ from 'lodash';

const DB_INITIAL_VERSION = 1;
// const DB_USER_PREFERENCES_VERSION = 2;

@Injectable({providedIn: 'root'})
export class IdbService {
  private config = inject(AppSettings);
  dbUpgraded = false;
  currentDbVersion = DB_INITIAL_VERSION;
  oldDbVersion = this.currentDbVersion;
  db: any;
  dbConnected = false;

  constructor() {
    console.log(`IdbService constructor()`);

    // create instance
    this.db = new Dexie(this.config.appName);

    // define schema
    this.db.version(DB_INITIAL_VERSION).stores({
      // all properties that need to be indexed go here
      tokenCache: 'id'
    });
    // this.db.version(DB_USER_PREFERENCES_VERSION).stores({
    //     userPreferences: 'email',
    // });

    // open the database
    this.db.open()
      .then(() => {
        this.dbConnected = true;
        console.log(`Connected to indexed-db`);
      })
      .catch((e: any) => {
        console.error(`db.open() failed: ${e}`);
      });
  }

  async deleteDatabase() {
    const db = new Dexie(this.config.appName);
    return db.delete();
  }

  async addItem(storeName: string, item: any) {
    await this.db[storeName].add(item);
  }

  async batchAdd(storeName: string, items: any[]) {
    await this.db[storeName].bulkAdd(items);
  }

  async getAll(storeName: string) {
    return await this.db[storeName].toArray();
  }

  async getByKey(storeName: string, key: any) {
    return await this.db[storeName].get(key);
  }

  async batchGet(storeName: string, keys: any[]) {
    return await this.db[storeName].bulkGet(keys);
  }

  async updateByKey(storeName: string, key: any, item: any) {
    return await this.db[storeName].update(key, item);
  }

  async upsert(storeName: string, item: any, key?: any) {
    // this will either update the existing item or create a new one if it does not exist
    return await this.db[storeName].put(item, key);
  }

  async batchUpdate(storeName: string, items: any[]) {
    return await this.db[storeName].bulkPut(items);
  }

  async deleteAll(storeName: string) {
    await this.db[storeName].clear();
    // return this.db[storeName].clear();
  }

  async deleteByKey(storeName: string, key: any) {
    await this.db[storeName].delete(key);
  }

  async batchDelete(storeName: string, keys: any[]) {
    await this.db[storeName].bulkDelete(keys);
  }

}
