import {Injectable} from '@angular/core';
import {IdbService} from '@ng-common/indexed-db/idb.service';
import {IdbStoreNames} from '@common/constants/idb-store-names.constants';
import {Tokens} from '../models/tokens.model';

@Injectable({providedIn: 'root'})
export class AuthTokenCacheService {
  constructor(
    private idbService: IdbService,
  ) {}

  async cacheTokens(tokens: Tokens): Promise<Tokens> {
    // async/await version
    await this.clearCachedTokens();
    await this.idbService.deleteAll(IdbStoreNames.tokenCache);
    const dbItem = this.createSimpleDbItemFromObject(tokens);
    await this.idbService.addItem(IdbStoreNames.tokenCache, dbItem);
    return tokens;

    // pure promise version
    // return this.clearCachedTokens()
    //     .then((result) => {
    //         // save the tokenResponse to local db (IndexedDB)
    //         return this.createSimpleDbItemFromObject(tokens);
    //     })
    //     .then((dbItem) => {
    //         // basically, just wait until the add is done, then return the tokens
    //         return this.idbService.addItem(IdbStoreNames.tokenCache, dbItem);
    //     });

  }

  getCachedTokens() {
    // the tokenResponse object is stored as id: 1
    return this.idbService.getByKey(IdbStoreNames.tokenCache, 1);
  }

  async clearCachedTokens() {
    // clear out existing local tokenCache store
    return this.idbService.deleteAll(IdbStoreNames.tokenCache);
  }

  async adminDeleteAccessToken() {
    // the tokenResponse object is stored as id: 1
    const tokenResponse = await this.idbService.getByKey(IdbStoreNames.tokenCache, 1);

    // alter tokenResponse to delete accessToken
    tokenResponse.accessToken = undefined;

    const savedTokenResponse = await this.cacheTokens(tokenResponse);

    return savedTokenResponse;
  }

  private createSimpleDbItemFromObject(object: any) {
    // basically just adding an id = 1 to the object, so we can query it by id
    const dbItem = Object.assign({id: 1}, object);
    return dbItem;
  }
}
