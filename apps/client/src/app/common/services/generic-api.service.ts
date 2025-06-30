import {throwError as observableThrowError, Observable, firstValueFrom} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import { HttpService } from './http.service';
import { catchError, map } from 'rxjs/operators';
import Utils from '../utils/utils';
import { HttpParams } from '@angular/common/http';
import {AppSettings} from '@common/models/app-settings.model';
import {ApiResponse} from '@common/models/api-response.type';

@Injectable()
export abstract class GenericApiService<TData> {
  protected baseUrl: string;
  protected http: HttpService = inject(HttpService);
  protected config: AppSettings = inject(AppSettings);

  protected constructor(resourceName: string) {
    this.baseUrl =  `${this.config.apiUrl}/${resourceName}`;
  }

  //abstract createModel(data: any): TData;

  getAll(params?: any): Observable<TData[]> {
    console.log(`Making GET request to: ${this.baseUrl}`, params);
    return this.http.get(this.baseUrl, params)
      .pipe(
        map((response) => this.extractDataList(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getAllAsPromise(params?: any): Promise<TData[]> {
    return firstValueFrom(this.getAll(params));
  }

  getById(id: number | string): Observable<TData> {
    return this.http.get(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getByIdAsPromise(id: number | string): Promise<TData> {
    return firstValueFrom(this.getById(id));
  }

  getCustom<customType>(): Observable<customType | {}> {
    return this.http.get<customType>(`${this.baseUrl}`)
      .pipe(
        map((response) => this.extractCustomData<customType>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCustomAsPromise<customType>(): Promise<customType | {}> {
    return firstValueFrom(this.getCustom<customType>());
  }

  getCustomList<customType>(): Observable<customType[]> {
    return this.http.get<customType>(`${this.baseUrl}`)
      .pipe(
        map((response) => this.extractCustomDataList<customType>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCustomListAsPromise<customType>(): Promise<customType[]> {
    return firstValueFrom(this.getCustomList<customType>());
  }

  create(item: TData): Observable<TData> {
    return this.http.post(`${this.baseUrl}`, item)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  createAsPromise(item: TData): Promise<TData> {
    return firstValueFrom(this.create(item));
  }

  update(id: number | string, item: TData): Observable<TData> {
    return this.http.put(`${this.baseUrl}/${id}`, item)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  updateAsPromise(id: number | string, item: TData): Promise<TData> {
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

  extractData(response: any, returnApiResponse: boolean = false): TData {
    const item = this.convertJsonToModel(response);

    return item;
  }

  extractDataList(response: any): TData[] {
    const items = this.convertJsonToModelArray(response);

    return items;
  }

  extractCustomData<customType>(response: any): customType | {} {
    const item = this.convertJsonToCustomModel<customType>(response);
    return item;
  }

  extractCustomDataList<customType>(response: any): customType[] {
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

  // todo: refactor this createModel stuff - we don't create models anymore
  private convertJsonToModel(response: any): TData {
    let data;

    if (response?.data) {
      data = response.data;
      if (typeof data !== 'object') {
        data = Utils.tryParseJSON(data);
      }
    }

    return data as TData;
  }

  // refactor this createModel stuff - we don't create models anymore - lean more towards a util or something to handle apiResponse
  private convertJsonToModelArray(response: any): TData[] {
    const dataList: TData[] = [];

    if (response?.data && Array.isArray(response?.data)) {
      for (const item of response.data) {
        if (item) {
          if (typeof item !== 'object') {
            const parsedItem = Utils.tryParseJSON(item);
            dataList.push(parsedItem);
          } else {
            dataList.push(item);
          }
        }
      }
    }

    return dataList;
  }

  private convertJsonToCustomModel<dataType>(response: any): dataType | {} {
    let data;

    if (response?.data) {
      data = (response.data as dataType) || {};
    }

    return data as dataType | {};
  }

  private convertJsonToCustomModelArray<dataListType>(response: any): dataListType[] {
    let dataList: dataListType[] = [];

    if (response?.data) {
      dataList = (response.data as dataListType[]) || [];
    }

    return dataList;
  }

}
