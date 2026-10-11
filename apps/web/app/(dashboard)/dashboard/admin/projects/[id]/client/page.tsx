"use client";

import { use, useEffect } from "react";
import { AdminClientInfoPanel } from "@/components/client-detail/AdminClientInfoPanel";
import { ErrorState } from "@/components/design-system/EmptyState";
import { ProjectDetailLoading } from "@/components/project-detail/ProjectDetailPattern";
import {
  useGetAdminProjectByIdQuery,
} from "@/features/admin/adminProjectsApi";
import { useLazyGetAdminClientByIdQuery } from "@/features/admin/adminClientsApi";
import { adminErrorMessage } from "@/lib/i18n";

export default function AdminProjectClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    currentData: project,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
    refetch: refetchProject,
  } = useGetAdminProjectByIdQuery(id);
  const clientId = project?.client.id;
  const [loadClient, clientQuery] = useLazyGetAdminClientByIdQuery();
  const client = clientQuery.currentData;
  const hasCurrentClient = Boolean(clientId && client?.id === clientId);
  const isClientLoading = clientQuery.isFetching;
  const isClientError =
    clientQuery.isError && clientQuery.originalArgs === clientId;

  useEffect(() => {
    if (
      clientId &&
      !hasCurrentClient &&
      !isClientLoading &&
      !isClientError
    ) {
      loadClient(clientId);
    }
  }, [
    clientId,
    hasCurrentClient,
    isClientLoading,
    isClientError,
    loadClient,
  ]);

  if (isProjectLoading) return <ProjectDetailLoading />;

  if (isProjectError || !project) {
    return (
      <ErrorState
        title="تعذّر تحميل بيانات المشروع"
        message={adminErrorMessage(projectError)}
        onRetry={() => refetchProject()}
      />
    );
  }

  return (
    <AdminClientInfoPanel
      clientId={clientId}
      client={hasCurrentClient ? client : undefined}
      isLoading={isClientLoading || Boolean(clientId && !hasCurrentClient && !isClientError)}
      error={isClientError ? clientQuery.error : undefined}
      onRetry={() => {
        if (clientId) loadClient(clientId);
      }}
    />
  );
}
