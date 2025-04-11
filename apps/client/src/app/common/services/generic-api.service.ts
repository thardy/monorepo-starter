import {throwError as observableThrowError, Observable, firstValueFrom} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import { HttpService } from './http.service';
import { catchError, map } from 'rxjs/operators';
import Utils from '../utils/utils';
import { HttpParams } from '@angular/common/http';
import {AppSettings} from '@common/models/app-settings.model';
import {ApiResponse} from '@common/models/api-response.type';
import {Tokens} from '@ng-common/auth/models/tokens.model';

@Injectable()
export abstract class GenericApiService<TData> {
  protected baseUrl: string;
  protected http: HttpService = inject(HttpService);
  protected config: AppSettings = inject(AppSettings);

  protected constructor(resourceName: string) {
    this.baseUrl =  `${this.config.apiUrl}/${resourceName}`;
  }

  abstract createModel(data: any): TData;

  getAll(params?: any): Observable<TData[] | undefined> {
    return this.http.get(this.baseUrl, params)
      .pipe(
        map((response) => this.extractDataList(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getAllAsPromise(params?: any): Promise<TData[] | undefined> {
    return firstValueFrom(this.getAll(params));
  }

  getById(id: number | string): Observable<TData | undefined> {
    return this.http.get(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getByIdAsPromise(id: number | string): Promise<TData | undefined> {
    return firstValueFrom(this.getById(id));
  }

  getCustom<customType>(): Observable<customType | {} | undefined> {
    return this.http.get<customType>(`${this.baseUrl}`)
      .pipe(
        map((response) => this.extractCustomData<customType>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCustomAsPromise<customType>(): Promise<customType | {} | undefined> {
    return firstValueFrom(this.getCustom<customType>());
  }

  getCustomList<customType>(): Observable<customType[] | undefined> {
    return this.http.get<customType>(`${this.baseUrl}`)
      .pipe(
        map((response) => this.extractCustomDataList<customType>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCustomListAsPromise<customType>(): Promise<customType[] | undefined> {
    return firstValueFrom(this.getCustomList<customType>());
  }

  create(item: TData): Observable<TData | undefined> {
    return this.http.post(`${this.baseUrl}`, item)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  createAsPromise(item: TData): Promise<TData | undefined> {
    return firstValueFrom(this.create(item));
  }

  update(id: number | string, item: TData): Observable<TData | undefined> {
    return this.http.put(`${this.baseUrl}/${id}`, item)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  updateAsPromise(id: number | string, item: TData): Promise<TData | undefined> {
    return firstValueFrom(this.update(id, item));
  }

  delete(id: number | string): Observable<object> {
    return this.http.delete(`${this.baseUrl}/${id}`)
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }

  deleteAsPromise(id: number | string): Promise<object> {
    return firstValueFrom(this.delete(id));
  }

  extractData(response: any, returnApiResponse: boolean = false): TData | undefined {
    const item = this.convertJsonToModel(response);

    return item;
  }

  extractDataList(response: any): TData[] | undefined {
    const items = this.convertJsonToModelArray(response);

    return items;
  }

  extractCustomData<customType>(response: any): customType | {} | undefined {
    const item = this.convertJsonToCustomModel<customType>(response);
    return item;
  }

  extractCustomDataList<customType>(response: any): customType[] | undefined {
    const items = this.convertJsonToCustomModelArray<customType>(response);
    return items;
  }

  extractAnyData(response: any) {
    return (response?.data as any) || {};
  }

  extractStringData(response: any) {
    return (response?.data as string) || '';
  }

  extractNumberData(response: any) {
    if (response?.data && typeof response?.data === 'number') {
      return response.data as number;
    } else {
      return 0;
    }
  }

  extractAnyResponse(response: any) {
    return (response as any) || {};
  }

  handleError(error: any) {
    // no handling currently
    return observableThrowError(() => error);
  }

  protected convertObjectToHttpParams(params: any) {
    let httpParams = new HttpParams();

    for (const property in params) {
      if (params.hasOwnProperty(property)) {
        httpParams = httpParams.append(property, params[property]);
      }
    }

    return httpParams;
  }

  private convertJsonToModel(response: any): TData | undefined {
    let data;
    let responseData;

    if (response?.data) {
      if (typeof response.data !== 'object') {
        responseData = Utils.tryParseJSON(response.data);
      }
      data = this.createModel(responseData);
    }

    return data;
  }

  private convertJsonToModelArray(response: any): TData[] | undefined {
    let dataList;

    if (response?.data && Array.isArray(response?.data)) {
      dataList = [];
      for (let item of response.data) {
        if (item) {
          if (typeof item !== 'object') {
            item = Utils.tryParseJSON(item);
          }
          dataList.push(this.createModel(item));
        }
      }
    }

    return dataList;
  }

  private convertJsonToCustomModel<dataType>(response: any): dataType | {} | undefined {
    let data;

    if (response?.data) {
      data = (response.data as dataType) || {};
    }

    return data;
  }

  private convertJsonToCustomModelArray<dataListType>(response: any): dataListType[] | undefined {
    let dataList;

    if (response?.data) {
      dataList = (response.data as dataListType[]) || [];
    }

    return dataList;
  }

}
