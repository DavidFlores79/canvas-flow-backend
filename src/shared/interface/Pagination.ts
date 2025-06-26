export interface PaginatedResult<T> {
  docs: T[];
  total: number;
  limit: number;
  pages: number;
  page: number;
}
