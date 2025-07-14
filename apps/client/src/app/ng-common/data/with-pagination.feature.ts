import { computed } from '@angular/core';
import { signalStoreFeature, withComputed, withState } from '@ngrx/signals';

import { IPagination } from '../models/pagination.interface';

export type PaginationState = { pagination: IPagination };

const initialPaginationState: IPagination = {
  total: 0,
  page: 1,
  pageSize: 10,
  // totalPages is optional and will be computed. IPagination.totalPages exists primarily to allow the full API response to 
  //  flow into the store without type issues. UX should use the computed totalPages().
};

export function withPagination(pageSize: number = 10) {
  return signalStoreFeature(
    withState<PaginationState>({ 
      pagination: { ...initialPaginationState, pageSize } 
    }),
    withComputed(({ pagination }) => ({
      totalPages: computed(() => Math.ceil(pagination().total / pagination().pageSize)),
      hasNextPage: computed(() => pagination().page < Math.ceil(pagination().total / pagination().pageSize)),
      hasPreviousPage: computed(() => pagination().page > 1),
    }))
  );
}

// For bulk updates from API (supports full API response including totalPages)
// Note: API's totalPages gets stored in state, but UX should use the computed totalPages() signal for reliability
export function setPagination(pagination: Partial<IPagination>) {
  return { pagination };
}

// For API responses - preserves client-configured pageSize
export function setPaginationFromApi(apiPagination: Partial<IPagination>, state: any) {
  return {
    pagination: {
      ...state.pagination,
      total: apiPagination.total ?? state.pagination.total,
      page: apiPagination.page ?? state.pagination.page,
      totalPages: apiPagination.totalPages ?? state.pagination.totalPages,
      // Preserve client-configured pageSize - don't use API's pageSize
    }
  };
}

// For individual property updates
export function setPage(page: number) {
  return { pagination: { page } };
}

export function setPageSize(pageSize: number) {
  return { pagination: { pageSize, page: 1 } }; // Reset to page 1 when changing page size
}

export function setTotal(total: number) {
  return { pagination: { total } };
}

// For local operations that don't refetch from database
export function incrementPaginationTotal(state: any) {
  return {
    pagination: { 
      ...state.pagination,
      total: state.pagination.total + 1 
    }
  };
}

export function decrementPaginationTotal(state: any) {
  return {
    pagination: { 
      ...state.pagination,
      total: Math.max(0, state.pagination.total - 1) 
    }
  };
} 