import { PaginationState } from "../core/Models/Pagination";

export function paginate<T>(items: T[], state: PaginationState): T[] {
  const start = (state.page - 1) * state.pageSize;
  return items.slice(start, start + state.pageSize);
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}
