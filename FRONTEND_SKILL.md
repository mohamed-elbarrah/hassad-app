# FRONTEND_SKILL.md — Hassad Frontend Standards

> Read AGENT.md first. This file governs all work inside `apps/web/`.

---

## Versions (locked)

```json
{
  "next": "^16.2.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.x",
  "@reduxjs/toolkit": "^2.x",
  "react-redux": "^9.x",
  "react-hook-form": "^7.x",
  "zod": "^4.x",
  "@hookform/resolvers": "^5.x",
  "tailwindcss": "^4.x",
  "@shadcn/ui": "latest"
}
```

> Zod v4 import note: use `import { z } from 'zod'` — v4 is the default export.
> For `zodResolver`, use `@hookform/resolvers/zod` (resolvers v5 supports Zod v4 natively).

---

## Folder Structure (mandatory)

```
apps/web/
├── app/
│   ├── (dashboard)/              ← internal roles (ADMIN, PM, SALES, etc.)
│   │   ├── layout.tsx            ← auth check: rejects non-internal roles
│   │   ├── (admin)/
│   │   │   └── page.tsx
│   │   ├── (pm)/
│   │   │   └── page.tsx
│   │   ├── (sales)/
│   │   └── ...
│   ├── (portal)/                 ← CLIENT role only
│   │   ├── layout.tsx            ← auth check: rejects non-CLIENT roles
│   │   └── ...
│   ├── layout.tsx                ← root layout (providers only, no auth logic)
│   └── middleware.ts             ← token validation only (no hostname checks)
│
├── components/
│   ├── ui/                       ← shadcn primitives ONLY (never modify directly)
│   ├── common/                   ← shared across all roles (Navbar, Sidebar, etc.)
│   ├── dashboard/                ← internal dashboard components
│   │   ├── crm/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── finance/
│   │   └── marketing/
│   └── portal/                   ← client portal components
│
├── features/                     ← RTK Query API slices + Redux state per domain
│   ├── auth/
│   │   ├── authSlice.ts
│   │   └── authApi.ts
│   ├── clients/
│   │   ├── clientsApi.ts
│   │   └── clientsSlice.ts       ← only if local UI state is needed
│   ├── projects/
│   ├── tasks/
│   ├── invoices/
│   └── campaigns/
│
├── lib/
│   ├── store.ts                  ← Redux store configuration
│   ├── hooks.ts                  ← typed useAppDispatch / useAppSelector
│   ├── utils.ts                  ← cn(), formatDate(), formatCurrency(), etc.
│   └── constants.ts              ← app-level constants
│
├── hooks/                        ← custom React hooks (non-RTK)
│   └── useDebounce.ts
│
├── types/                        ← frontend-only types
│                                    (import shared types from packages/shared)
│
└── providers/
    └── Providers.tsx             ← Redux Provider, ThemeProvider
```

**Rule:** If a component is used in only one place, it lives next to that page. If used in 2+ places, it moves to `components/`.

---

## State Management: RTK Query + Redux Toolkit

### RTK Query — all server state (API calls)

No raw `fetch()` or `axios` in components. All API communication goes through RTK Query.

```typescript
// features/clients/clientsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/lib/store'
import type { Client, CreateClientDto } from '@hassad/shared'

export const clientsApi = createApi({
  reducerPath: 'clientsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Client'],
  endpoints: (builder) => ({
    getClients: builder.query<Client[], { status?: string }>({
      query: ({ status } = {}) => ({
        url: '/clients',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Client'],
    }),
    createClient: builder.mutation<Client, CreateClientDto>({
      query: (body) => ({ url: '/clients', method: 'POST', body }),
      invalidatesTags: ['Client'],
    }),
  }),
})

export const { useGetClientsQuery, useCreateClientMutation } = clientsApi
```

### Redux Toolkit — UI/session state only

Use Redux slices **only** for:
- Current user session (`authSlice`)
- UI flags (modal open/close, sidebar state)
- Multi-step form progress
- Optimistic UI state

```typescript
// features/auth/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@hassad/shared'

interface AuthState {
  user: User | null
  token: string | null
}

const initialState: AuthState = { user: null, token: null }

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
    logout: () => initialState,
  },
})

export const { setCredentials, logout } = authSlice.actions
```

---

## Forms: React Hook Form v7 + Zod v4

Every form uses this exact pattern — no exceptions.

```typescript
// components/dashboard/crm/CreateClientForm.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateClientMutation } from '@/features/clients/clientsApi'

// Zod v4 schema
const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(9, 'Invalid phone number'),
  businessType: z.enum(['restaurant', 'clinic', 'store', 'service']),
})

type CreateClientFormValues = z.infer<typeof createClientSchema>

export function CreateClientForm({ onSuccess }: { onSuccess: () => void }) {
  const [createClient, { isLoading }] = useCreateClientMutation()

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: '', phone: '', businessType: 'store' },
  })

  async function onSubmit(values: CreateClientFormValues) {
    try {
      await createClient(values).unwrap()
      onSuccess()
    } catch {
      form.setError('root', { message: 'Failed to create client. Please try again.' })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Business name..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* other fields */}
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Client'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Component Rules

### ✅ DO

- One component = one file = one clear responsibility
- Export components as **named exports** (easier to refactor and find)
- Keep components under **150 lines** — if longer, split it
- Use shadcn/ui primitives as base for all UI elements
- Fetch data at page or feature level — pass down via props
- Use `cn()` from `lib/utils.ts` for conditional classNames
- React 19: use `use()` for promise unwrapping in Server Components where applicable

### ❌ FORBIDDEN

- `any` type — use `unknown` and narrow, or define proper types
- Inline styles (`style={{}}`) — use Tailwind classes only
- Direct `fetch()` or `axios` inside components
- Local component state for server data — that's RTK Query's job
- Modifying files inside `components/ui/` — extend via new files, never edit originals
- One giant file containing multiple unrelated components
- `useEffect` for data fetching — RTK Query handles this
- Hardcoded API URLs, colors, or magic strings

---

## Page Structure Pattern

```typescript
// app/(dashboard)/(sales)/clients/page.tsx
import { ClientsTable } from '@/components/dashboard/crm/ClientsTable'
import { CreateClientDialog } from '@/components/dashboard/crm/CreateClientDialog'
import { ClientFilters } from '@/components/dashboard/crm/ClientFilters'

// Page = layout + composition only. No business logic here.
export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <CreateClientDialog />
      </div>
      <ClientFilters />
      <ClientsTable />
    </div>
  )
}
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `ClientsTable.tsx` |
| Hooks | camelCase with `use` prefix | `useClientFilters.ts` |
| RTK API slices | camelCase + `Api` suffix | `clientsApi.ts` |
| Redux slices | camelCase + `Slice` suffix | `authSlice.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Zod schemas | camelCase + `Schema` suffix | `createClientSchema` |
| Types/Interfaces | PascalCase | `ClientFilters` |

---

## Error Handling in UI

```typescript
const { data: clients, isLoading, isError } = useGetClientsQuery({})

if (isLoading) return <ClientsTableSkeleton />
if (isError) return <ErrorState message="Failed to load clients" />
if (!clients?.length) return <EmptyState message="No clients yet" action={<CreateClientDialog />} />

return <ClientsTable clients={clients} />
```

- **API errors**: display via `FormMessage` (forms) or toast notification (actions)
- **Loading states**: use RTK Query's `isLoading` / `isFetching` flags — always show skeletons
- **Empty states**: always provide a meaningful empty state with a call to action

---

## shadcn/ui Usage

- Install: `npx shadcn@latest add [component]`
- All installed components land in `components/ui/` — treat as **read-only**
- Build feature components **on top** of these primitives
- For custom variants, use `cva()` in a new file — never edit the original

---

## Performance Rules

- Use `dynamic()` import for heavy components (charts, rich text editors, file pickers)
- Paginate all lists — never load all records at once
- RTK Query caching: set `keepUnusedDataFor` appropriately per endpoint (default is 60s)
- Memoize Redux selectors with `createSelector` from `@reduxjs/toolkit` when selecting from large state
- Next.js 16: leverage `use cache` / Cache Components for data that doesn't change per-request
