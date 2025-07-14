import {throwError as observableThrowError, Observable, firstValueFrom} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import { HttpService } from './http.service';
import { catchError, map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import {AppSettings} from '@common/models/app-settings.model';
import {ApiResponse} from '@common/models/api-response.type';
import {IPagedResult, IQueryOptions} from '@loomcore/common/models';

@Injectable()
export abstract class GenericApiService<TData> {
  protected baseUrl: string;
  protected http: HttpService = inject(HttpService);
  protected config: AppSettings = inject(AppSettings);

  protected constructor(resourceName: string) {
    this.baseUrl =  `${this.config.apiUrl}/${resourceName}`;
  }

  getAll(): Observable<TData[]> {
    return this.http.get<ApiResponse<TData[]>>(`${this.baseUrl}/all`)
      .pipe(
        map((response) => this.extractDataList(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getAllAsPromise(): Promise<TData[]> {
    return firstValueFrom(this.getAll());
  }

  get(queryOptions?: IQueryOptions): Observable<IPagedResult<TData>> {
    const httpOptions = queryOptions ? { params: this.convertQueryOptionsToHttpParams(queryOptions) } : {};
    return this.http.get<ApiResponse<IPagedResult<TData>>>(`${this.baseUrl}`, httpOptions)
      .pipe(
        map((response) => this.extractPagedResult(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getAsPromise(queryOptions?: IQueryOptions): Promise<IPagedResult<TData>> {
    return firstValueFrom(this.get(queryOptions));
  }

  getById(id: number | string): Observable<TData> {
    return this.http.get<ApiResponse<TData>>(`${this.baseUrl}/${id}`)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getByIdAsPromise(id: number | string): Promise<TData> {
    return firstValueFrom(this.getById(id));
  }

  getCustom<TCustom>(): Observable<TCustom> {
    return this.http.get<ApiResponse<TCustom>>(`${this.baseUrl}`)
      .pipe(
        map((response) => this.extractCustomData<TCustom>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCustomAsPromise<TCustom>(): Promise<TCustom> {
    return firstValueFrom(this.getCustom<TCustom>());
  }

  getCustomList<TCustom>(): Observable<TCustom[]> {
    return this.http.get<ApiResponse<TCustom[]>>(`${this.baseUrl}`)
      .pipe(
        map((response) => this.extractCustomDataList<TCustom>(response)),
        catchError((error) => this.handleError(error))
      );
  }

  getCustomListAsPromise<TCustom>(): Promise<TCustom[]> {
    return firstValueFrom(this.getCustomList<TCustom>());
  }

  create(item: TData): Observable<TData> {
    return this.http.post<ApiResponse<TData>>(`${this.baseUrl}`, item)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  createAsPromise(item: TData): Promise<TData> {
    return firstValueFrom(this.create(item));
  }

  update(id: number | string, item: TData): Observable<TData> {
    return this.http.put<ApiResponse<TData>>(`${this.baseUrl}/${id}`, item)
      .pipe(
        map((response) => this.extractData(response)),
        catchError((error) => this.handleError(error))
      );
  }

  updateAsPromise(id: number | string, item: TData): Promise<TData> {
    return firstValueFrom(this.update(id, item));
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => void 0),
        catchError((error) => this.handleError(error))
      );
  }

  deleteAsPromise(id: number | string): Promise<void> {
    return firstValueFrom(this.delete(id));
  }

  /**
   * Extracts single data item from API response
   */
  private extractData(response: ApiResponse<TData>): TData {
    if (response?.data !== undefined && response.data !== null) {
      return response.data;
    }
    throw new Error('No data found in API response');
  }

  /**
   * Extracts paged result from API response
   */
  private extractPagedResult(response: ApiResponse<IPagedResult<TData>>): IPagedResult<TData> {
    if (response?.data !== undefined && response.data !== null) {
      return response.data;
    }
    throw new Error('No data found in API response');
  }

  /**
   * Extracts array of data items from API response
   * Used by getAll() which expects direct arrays from /all endpoints
   */
  private extractDataList(response: ApiResponse<TData[]>): TData[] {
    if (response?.data !== undefined && response.data !== null) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  }

  /**
   * Extracts custom typed data from API response
   */
  private extractCustomData<TCustom>(response: ApiResponse<TCustom>): TCustom {
    if (response?.data !== undefined && response.data !== null) {
      return response.data;
    }
    throw new Error('No data found in API response');
  }

  /**
   * Extracts custom typed array data from API response
   */
  private extractCustomDataList<TCustom>(response: ApiResponse<TCustom[]>): TCustom[] {
    if (response?.data !== undefined && response.data !== null) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  }

  /**
   * Extracts raw data without type checking (use sparingly)
   */
  extractAnyData(response: ApiResponse<any>): any {
    return response?.data || {};
  }

  /**
   * Extracts string data from API response
   */
  extractStringData(response: ApiResponse<string>): string {
    return response?.data || '';
  }

  /**
   * Extracts number data from API response
   */
  extractNumberData(response: ApiResponse<number>): number {
    return response?.data || 0;
  }

  /**
   * Extracts the entire API response (including metadata)
   */
  extractAnyResponse(response: ApiResponse<any>): ApiResponse<any> {
    return response || {};
  }

  /**
   * Handles API errors - override in subclasses for custom error handling
   */
  protected handleError(error: any): Observable<never> {
    // Basic error handling - can be enhanced in subclasses
    return observableThrowError(() => error);
  }

  /**
   * Converts IQueryOptions to HttpParams for query strings
   * Handles the nested filters structure properly
   */
  protected convertQueryOptionsToHttpParams(queryOptions: IQueryOptions): HttpParams {
    let httpParams = new HttpParams();

    // Handle simple properties
    if (queryOptions.orderBy !== undefined && queryOptions.orderBy !== null) {
      httpParams = httpParams.append('orderBy', queryOptions.orderBy);
    }

    if (queryOptions.sortDirection !== undefined && queryOptions.sortDirection !== null) {
      httpParams = httpParams.append('sortDirection', queryOptions.sortDirection.toString());
    }

    if (queryOptions.page !== undefined && queryOptions.page !== null) {
      httpParams = httpParams.append('page', queryOptions.page.toString());
    }

    if (queryOptions.pageSize !== undefined && queryOptions.pageSize !== null) {
      httpParams = httpParams.append('pageSize', queryOptions.pageSize.toString());
    }

    // Handle filters object
    if (queryOptions.filters) {
      for (const [fieldName, filter] of Object.entries(queryOptions.filters)) {
        for (const [filterType, filterValue] of Object.entries(filter)) {
          if (filterValue !== undefined && filterValue !== null) {
            const paramName = `filters[${fieldName}][${filterType}]`;
            if (Array.isArray(filterValue)) {
              // Handle array values (e.g., in, any, all)
              httpParams = httpParams.append(paramName, filterValue.join(','));
            } else {
              // Handle single values
              httpParams = httpParams.append(paramName, filterValue.toString());
            }
          }
        }
      }
    }

    return httpParams;
  }

  /**
   * Converts object to HttpParams for query strings
   */
  protected convertObjectToHttpParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    for (const property in params) {
      if (params.hasOwnProperty(property) && params[property] !== undefined && params[property] !== null) {
        httpParams = httpParams.append(property, params[property].toString());
      }
    }

    return httpParams;
  }
}
