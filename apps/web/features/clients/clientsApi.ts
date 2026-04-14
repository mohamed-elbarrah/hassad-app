// apps/web/features/clients/clientsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/lib/store'
import type { Client } from '@hassad/shared'

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
    // createClient mutation would go here
  }),
})

export const { useGetClientsQuery } = clientsApi
