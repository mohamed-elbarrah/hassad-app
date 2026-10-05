import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer, { logout } from "@/features/auth/authSlice";
import { authApi } from "@/features/auth/authApi";
import { clientsApi } from "@/features/clients/clientsApi";
import { projectsApi } from "@/features/projects/projectsApi";
import { tasksApi } from "@/features/tasks/tasksApi";
import { teamApi } from "@/features/team/teamApi";
import { usersApi } from "@/features/users/usersApi";
import { notificationsApi } from "@/features/notifications/notificationsApi";
import { proposalsApi } from "@/features/proposals/proposalsApi";
import { contractsApi } from "@/features/contracts/contractsApi";
import { requestsApi } from "@/features/requests/requestsApi";
import { salesApi } from "@/features/sales/salesApi";
import { financeApi } from "@/features/finance/financeApi";

import { marketingApi } from "@/features/marketing/marketingApi";
import { portalApi } from "@/features/portal/portalApi";
import { portalNotificationsApi } from "@/features/portal-notifications/portalNotificationsApi";
import { servicesApi } from "@/features/services/servicesApi";
import { chatApi } from "@/features/chat/chatApi";
import { settingsApi } from "@/features/settings/settingsApi";
import { integrationsApi } from "@/features/settings/integrationsApi";
import notificationsReducer from "@/features/notifications/notificationsSlice";
import { adminApi } from "@/features/admin/adminApi";
import { adminUsersApi } from "@/features/admin/adminUsersApi";
import { adminServicesApi } from "@/features/admin/adminServicesApi";
import { adminProjectsApi } from "@/features/admin/adminProjectsApi";
import { adminTasksApi } from "@/features/admin/adminTasksApi";
import { adminContractsApi } from "@/features/admin/adminContractsApi";
import { adminRequestsApi } from "@/features/admin/adminRequestsApi";
import { adminLeadsApi } from "@/features/admin/adminLeadsApi";
import { adminDisputesApi } from "@/features/admin/adminDisputesApi";
import { adminClientsApi } from "@/features/admin/adminClientsApi";
import { adminProposalsApi } from "@/features/admin/adminProposalsApi";
import { adminFinanceApi } from "@/features/admin/adminFinanceApi";
import { adminReportsApi } from "@/features/admin/adminReportsApi";
import { adminBackupsApi } from "@/features/admin/adminBackupsApi";
import { periodsApi } from "@/features/projects/periodsApi";
import { pmDisputesApi } from "@/features/disputes/pmDisputesApi";
import { aiAssistantApi } from "@/features/aiAssistantApi";
import { communicationApi } from "@/features/communication/communicationApi";

const authLifecycleMiddleware = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [proposalsApi.reducerPath]: proposalsApi.reducer,
    [contractsApi.reducerPath]: contractsApi.reducer,
    [requestsApi.reducerPath]: requestsApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [financeApi.reducerPath]: financeApi.reducer,

    [marketingApi.reducerPath]: marketingApi.reducer,
    [portalApi.reducerPath]: portalApi.reducer,
    [portalNotificationsApi.reducerPath]: portalNotificationsApi.reducer,
    [servicesApi.reducerPath]: servicesApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [integrationsApi.reducerPath]: integrationsApi.reducer,
    [periodsApi.reducerPath]: periodsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [adminUsersApi.reducerPath]: adminUsersApi.reducer,
    [adminServicesApi.reducerPath]: adminServicesApi.reducer,
    [adminProjectsApi.reducerPath]: adminProjectsApi.reducer,
    [adminTasksApi.reducerPath]: adminTasksApi.reducer,
    [adminContractsApi.reducerPath]: adminContractsApi.reducer,
    [adminRequestsApi.reducerPath]: adminRequestsApi.reducer,
    [adminLeadsApi.reducerPath]: adminLeadsApi.reducer,
    [adminDisputesApi.reducerPath]: adminDisputesApi.reducer,
    [adminClientsApi.reducerPath]: adminClientsApi.reducer,
    [adminProposalsApi.reducerPath]: adminProposalsApi.reducer,
    [adminFinanceApi.reducerPath]: adminFinanceApi.reducer,
    [adminReportsApi.reducerPath]: adminReportsApi.reducer,
    [adminBackupsApi.reducerPath]: adminBackupsApi.reducer,
    [pmDisputesApi.reducerPath]: pmDisputesApi.reducer,
    [aiAssistantApi.reducerPath]: aiAssistantApi.reducer,
    [communicationApi.reducerPath]: communicationApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = [
      authLifecycleMiddleware.middleware,
      authApi.middleware,
      clientsApi.middleware,
      projectsApi.middleware,
      tasksApi.middleware,
      teamApi.middleware,
      usersApi.middleware,
      notificationsApi.middleware,
      proposalsApi.middleware,
      contractsApi.middleware,
      requestsApi.middleware,
      salesApi.middleware,
      financeApi.middleware,

      marketingApi.middleware,
      portalApi.middleware,
      portalNotificationsApi.middleware,
      servicesApi.middleware,
      chatApi.middleware,
      settingsApi.middleware,
      integrationsApi.middleware,
      adminApi.middleware,
      adminUsersApi.middleware,
      adminServicesApi.middleware,
      adminProjectsApi.middleware,
      adminTasksApi.middleware,
      adminContractsApi.middleware,
      adminRequestsApi.middleware,
      adminLeadsApi.middleware,
      adminDisputesApi.middleware,
      adminClientsApi.middleware,
      adminProposalsApi.middleware,
      adminFinanceApi.middleware,
      adminReportsApi.middleware,
      adminBackupsApi.middleware,
      periodsApi.middleware,
      pmDisputesApi.middleware,
      aiAssistantApi.middleware,
      communicationApi.middleware,
    ];
    return getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(middleware);
  },
});

authLifecycleMiddleware.startListening({
  actionCreator: logout,
  effect: (_action, listenerApi) => {
    // A client-side route change does not recreate the Redux store. Clear every
    // RTK Query cache so the next account cannot see data fetched by this one.
    for (const api of [
      authApi,
      clientsApi,
      projectsApi,
      tasksApi,
      teamApi,
      usersApi,
      notificationsApi,
      proposalsApi,
      contractsApi,
      requestsApi,
      salesApi,
      financeApi,
      marketingApi,
      portalApi,
      portalNotificationsApi,
      servicesApi,
      chatApi,
      settingsApi,
      integrationsApi,
      adminApi,
      adminUsersApi,
      adminServicesApi,
      adminProjectsApi,
      adminTasksApi,
      adminContractsApi,
      adminRequestsApi,
      adminLeadsApi,
      adminDisputesApi,
      adminClientsApi,
      adminProposalsApi,
      adminFinanceApi,
      adminReportsApi,
      adminBackupsApi,
      periodsApi,
      pmDisputesApi,
      aiAssistantApi,
      communicationApi,
    ]) {
      listenerApi.dispatch(api.util.resetApiState());
    }
  },
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
