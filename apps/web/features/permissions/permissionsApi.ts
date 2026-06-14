import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/baseQuery";

export interface Permission {
  id: string;
  name: string;
}

export const permissionsApi = createApi({
  reducerPath: "permissionsApi",
  baseQuery,
  tagTypes: ["Permission"],
  endpoints: (builder) => ({
    getPermissions: builder.query<Permission[], void>({
      query: () => "/permissions",
      providesTags: ["Permission"],
    }),
  }),
});

export const { useGetPermissionsQuery } = permissionsApi;
