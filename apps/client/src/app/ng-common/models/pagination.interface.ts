export interface IPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number; // Optional - the store will compute whether or not this is provided
} 