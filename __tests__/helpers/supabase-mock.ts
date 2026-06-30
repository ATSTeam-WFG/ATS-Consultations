import { vi } from 'vitest'

/**
 * Creates a Proxy-based Supabase query chain that resolves to `value` when awaited.
 * Every chained method (select, eq, order, etc.) returns the same proxy,
 * so arbitrary chains work without per-method setup.
 */
export function buildChain(value: unknown) {
  const chain: object = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === 'then') {
          return (
            resolve: (v: unknown) => unknown,
            reject?: (e: unknown) => unknown,
          ) => Promise.resolve(value).then(resolve, reject)
        }
        if (prop === 'catch') {
          return (reject: (e: unknown) => unknown) =>
            Promise.resolve(value).catch(reject)
        }
        // Any other method returns the same chain
        return () => chain
      },
    },
  )
  return chain
}

/**
 * Creates a mock Supabase service-role client where each table lookup
 * returns the value provided in `tableData`.
 */
export function buildServiceRoleClient(
  tableData: Record<string, unknown>,
) {
  return {
    from: vi.fn((table: string) =>
      buildChain(tableData[table] ?? { data: null, error: null }),
    ),
  }
}

/**
 * Creates a mock auth Supabase client that returns `user` from getUser().
 */
export function buildAuthClient(user: unknown) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  }
}
