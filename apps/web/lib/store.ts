import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "@/features/auth/authSlice";
import { authApi } from "@/features/auth/authApi";
import { clientsApi } from "@/features/clients/clientsApi";
import { projectsApi } from "@/features/projects/projectsApi";
import { tasksApi } from "@/features/tasks/tasksApi";
import { usersApi } from "@/features/users/usersApi";
import { notificationsApi } from "@/features/notifications/notificationsApi";
import { proposalsApi } from "@/features/proposals/proposalsApi";
import { contractsApi } from "@/features/contracts/contractsApi";
import { salesApi } from "@/features/sales/salesApi";
import notificationsReducer from "@/features/notifications/notificationsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [proposalsApi.reducerPath]: proposalsApi.reducer,
    [contractsApi.reducerPath]: contractsApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      clientsApi.middleware,
      projectsApi.middleware,
      tasksApi.middleware,
      usersApi.middleware,
      notificationsApi.middleware,
      proposalsApi.middleware,
      contractsApi.middleware,
      salesApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
