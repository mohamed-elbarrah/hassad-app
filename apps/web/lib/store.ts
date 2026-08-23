import {
  configureStore,
  createListenerMiddleware,
} from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer, { logout } from "@/features/auth/authSlice";
import { authApi } from "@/features/auth/authApi";
import { clientsApi } from "@/features/clients/clientsApi";
import { leadsApi } from "@/features/leads/leadsApi";
import { projectsApi } from "@/features/projects/projectsApi";
import { tasksApi } from "@/features/tasks/tasksApi";
import { usersApi } from "@/features/users/usersApi";
import { notificationsApi } from "@/features/notifications/notificationsApi";
import { proposalsApi } from "@/features/proposals/proposalsApi";
import { contractsApi } from "@/features/contracts/contractsApi";
import { requestsApi } from "@/features/requests/requestsApi";
import { salesApi } from "@/features/sales/salesApi";
import { financeApi } from "@/features/finance/financeApi";

import { deliverablesApi } from "@/features/deliverables/deliverablesApi";
import { marketingApi } from "@/features/marketing/marketingApi";
import { portalApi } from "@/features/portal/portalApi";
import { portalNotificationsApi } from "@/features/portal-notifications/portalNotificationsApi";
import { servicesApi } from "@/features/services/servicesApi";
import { chatApi } from "@/features/chat/chatApi";
import { settingsApi } from "@/features/settings/settingsApi";
import { departmentsApi } from "@/features/departments/departmentsApi";
import { rolesApi } from "@/features/roles/rolesApi";
import { permissionsApi } from "@/features/permissions/permissionsApi";
import notificationsReducer from "@/features/notifications/notificationsSlice";
import { healthApi } from "@/features/health/healthApi";
import { adminApi } from "@/features/admin/adminApi";
import { adminUsersApi } from "@/features/admin/adminUsersApi";
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
import { periodsApi } from "@/features/projects/periodsApi";
import { pmDisputesApi } from "@/features/disputes/pmDisputesApi";
import { aiAssistantApi } from "@/features/aiAssistantApi";
import { notificationTemplatesApi } from "@/features/notification-templates/notificationTemplatesApi";
import { intakeFormApi } from "@/features/intakeForm/intakeFormApi";

const authLifecycleMiddleware = createListenerMiddleware();

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
    [requestsApi.reducerPath]: requestsApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [financeApi.reducerPath]: financeApi.reducer,

    [deliverablesApi.reducerPath]: deliverablesApi.reducer,
    [marketingApi.reducerPath]: marketingApi.reducer,
    [portalApi.reducerPath]: portalApi.reducer,
    [portalNotificationsApi.reducerPath]: portalNotificationsApi.reducer,
    [servicesApi.reducerPath]: servicesApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [departmentsApi.reducerPath]: departmentsApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [permissionsApi.reducerPath]: permissionsApi.reducer,
    [healthApi.reducerPath]: healthApi.reducer,
    [periodsApi.reducerPath]: periodsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [adminUsersApi.reducerPath]: adminUsersApi.reducer,
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
    [pmDisputesApi.reducerPath]: pmDisputesApi.reducer,
    [aiAssistantApi.reducerPath]: aiAssistantApi.reducer,
    [notificationTemplatesApi.reducerPath]: notificationTemplatesApi.reducer,
    [intakeFormApi.reducerPath]: intakeFormApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = [
      authLifecycleMiddleware.middleware,
      authApi.middleware,
      clientsApi.middleware,
      leadsApi.middleware,
      projectsApi.middleware,
      tasksApi.middleware,
      usersApi.middleware,
      notificationsApi.middleware,
      proposalsApi.middleware,
      contractsApi.middleware,
      requestsApi.middleware,
      salesApi.middleware,
      financeApi.middleware,

      deliverablesApi.middleware,
      marketingApi.middleware,
      portalApi.middleware,
      portalNotificationsApi.middleware,
      servicesApi.middleware,
      chatApi.middleware,
      settingsApi.middleware,
      departmentsApi.middleware,
      rolesApi.middleware,
      permissionsApi.middleware,
      healthApi.middleware,
      adminApi.middleware,
      adminUsersApi.middleware,
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
      periodsApi.middleware,
      pmDisputesApi.middleware,
      aiAssistantApi.middleware,
      notificationTemplatesApi.middleware,
      intakeFormApi.middleware,
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
      leadsApi,
      projectsApi,
      tasksApi,
      usersApi,
      notificationsApi,
      proposalsApi,
      contractsApi,
      requestsApi,
      salesApi,
      financeApi,
      deliverablesApi,
      marketingApi,
      portalApi,
      portalNotificationsApi,
      servicesApi,
      chatApi,
      settingsApi,
      departmentsApi,
      rolesApi,
      permissionsApi,
      healthApi,
      adminApi,
      adminUsersApi,
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
      periodsApi,
      pmDisputesApi,
      aiAssistantApi,
      notificationTemplatesApi,
      intakeFormApi,
    ]) {
      listenerApi.dispatch(api.util.resetApiState());
    }
  },
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
