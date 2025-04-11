import {ApiError} from './api-error.type';

export type ApiResponse<T> = {
  success?: boolean;
  status?: number;
  errors?: ApiError[];
  messages?: string[];
  data?: T | null;
  count?: number;
  total?: number;
  currentPage?: number;
};
