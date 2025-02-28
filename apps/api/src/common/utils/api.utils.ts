import {Request, Response} from 'express';
import {
	IApiResponse,
	IApiError,
	IQueryOptions,
	QueryOptions,
	IPagedResult,
	Filter
} from '@meritas-digital/risk-answer-models';
import {SortDirection} from '@meritas-digital/risk-answer-models/types';

export interface IApiResponseOptions<T> {
	messages?: string[];
	errors?: IApiError[];
	data?: T;
}
function apiResponse<T>(response: Response, status: number, options: IApiResponseOptions<T> = {}): Response {
	const success = status! >= 200 && status! < 300;
	let apiResponse: IApiResponse<T>;

	if (success) {
		apiResponse = {
			success,
			status,
			data: options?.data,
			messages: options?.messages,
			errors: options.errors,
		};
	}
	else {
		apiResponse = {
			success,
			status: status,
			errors: options.errors,
		};
	}

	return response.status(status!).json(apiResponse);
}

function getQueryOptionsFromRequest(request: Request): QueryOptions {
	const queryOptions: IQueryOptions = {
		orderBy: request.query.orderBy as string,
		sortDirection: request.query.sortDirection as SortDirection,
		page: request.query.page ? parseInt(request.query.page as string) : 1,
		pageSize: request.query.pageSize ? parseInt(request.query.pageSize as string) : 100,
		filters: request.query.filters as { [key: string]: Filter } | undefined
	};

	return new QueryOptions(queryOptions);
}

function getPagedResult<T>(entities: T[], totalRows: number, queryOptions: QueryOptions): IPagedResult<T> {
	const pagedResult = {
		entities,
		total: totalRows,
		page: queryOptions.page,
		pageSize: queryOptions.pageSize,
		totalPages: Math.ceil(totalRows / queryOptions.pageSize),
	};
	return pagedResult;
}

export const apiUtils =  {
	apiResponse,
	getQueryOptionsFromRequest,
	getPagedResult,
};

