import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "@/features/auth/authSlice";
import { authApi } from "@/features/auth/authApi";
import { clientsApi } from "@/features/clients/clientsApi";
import { leadsApi } from "@/features/leads/leadsApi";
import { projectsApi } from "@/features/projects/projectsApi";
import { tasksApi } from "@/features/tasks/tasksApi";
import { usersApi } from "@/features/users/usersApi";
import { notificationsApi } from "@/features/notifications/notificationsApi";
import { proposalsApi } from "@/features/proposals/proposalsApi";
import { contractsApi } from "@/features/contracts/contractsApi";
import { salesApi } from "@/features/sales/salesApi";
import { financeApi } from "@/features/finance/financeApi";

import { deliverablesApi } from "@/features/deliverables/deliverablesApi";
import { adminApi } from "@/features/admin/adminApi";
import { marketingApi } from "@/features/marketing/marketingApi";
import { portalApi } from "@/features/portal/portalApi";
import { servicesApi } from "@/features/services/servicesApi";
import notificationsReducer from "@/features/notifications/notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [leadsApi.reducerPath]: leadsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [proposalsApi.reducerPath]: proposalsApi.reducer,
    [contractsApi.reducerPath]: contractsApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [financeApi.reducerPath]: financeApi.reducer,

    [deliverablesApi.reducerPath]: deliverablesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [marketingApi.reducerPath]: marketingApi.reducer,
    [portalApi.reducerPath]: portalApi.reducer,
    [servicesApi.reducerPath]: servicesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(
      authApi.middleware,
      clientsApi.middleware,
      leadsApi.middleware,
      projectsApi.middleware,
      tasksApi.middleware,
      usersApi.middleware,
      notificationsApi.middleware,
      proposalsApi.middleware,
      contractsApi.middleware,
      salesApi.middleware,
      financeApi.middleware,

      deliverablesApi.middleware,
      adminApi.middleware,
      marketingApi.middleware,
      portalApi.middleware,
      servicesApi.middleware,
    ),
});


setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
