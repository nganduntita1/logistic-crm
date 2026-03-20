export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface PaginationArgs {
  page?: number | string | null
  pageSize?: number | string | null
}

export interface NormalizedPagination extends PaginationMeta {
  from: number
  to: number
}

function toPositiveInteger(value: number | string | null | undefined, fallback: number) {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value

  if (!parsed || Number.isNaN(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export function normalizePagination(
  args: PaginationArgs,
  options?: { defaultPageSize?: number; maxPageSize?: number }
): NormalizedPagination {
  const defaultPageSize = options?.defaultPageSize ?? 20
  const maxPageSize = options?.maxPageSize ?? 100
  const page = toPositiveInteger(args.page, 1)
  const requestedPageSize = toPositiveInteger(args.pageSize, defaultPageSize)
  const pageSize = Math.min(requestedPageSize, maxPageSize)

  return {
    page,
    pageSize,
    totalItems: 0,
    totalPages: 0,
    from: (page - 1) * pageSize,
    to: page * pageSize - 1,
  }
}

export function buildPaginationMeta(page: number, pageSize: number, totalItems: number): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  }
}