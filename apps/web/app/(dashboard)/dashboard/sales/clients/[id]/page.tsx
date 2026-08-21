"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import {
  useGetClientByIdQuery,
  useGetClientProfileQuery,
} from "@/features/clients/clientsApi";
import { useGetProjectsQuery } from "@/features/projects/projectsApi";
import { useGetContractsQuery } from "@/features/contracts/contractsApi";
import { useGetInvoicesQuery } from "@/features/finance/financeApi";
import { NewRequestForClientModal } from "@/components/dashboard/crm/NewRequestForClientModal";
import { ProfileEditTab } from "./profile-edit-tab";
import {
  SalesClientDetail,
  SalesClientDetailLoading,
} from "@/components/client-detail/SalesClientDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  clientRelatedErrorMessage,
  clientWorkflowErrorMessage,
} from "@/lib/i18n";

function State({
  title,
  description,
  retry,
  forbidden = false,
}: {
  title: string;
  description: string;
  retry?: () => void;
  forbidden?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-8">
        <Empty>
          <EmptyMedia variant="icon">
            <Building2 />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/sales/clients">
                  <ArrowLeft data-icon="inline-start" />
                  العودة للعملاء
                </Link>
              </Button>
              {!forbidden && retry ? (
                <Button onClick={retry}>إعادة المحاولة</Button>
              ) : null}
            </div>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}

function isForbidden(error: unknown) {
  return (error as { status?: number } | undefined)?.status === 403;
}

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const clientQuery = useGetClientByIdQuery(id);
  const profileQuery = useGetClientProfileQuery(id, {
    skip: clientQuery.isError || clientQuery.isLoading,
  });
  const projectsQuery = useGetProjectsQuery(
    { clientId: id },
    { skip: clientQuery.isError || clientQuery.isLoading },
  );
  const contractsQuery = useGetContractsQuery(
    { clientId: id },
    { skip: clientQuery.isError || clientQuery.isLoading },
  );
  const invoicesQuery = useGetInvoicesQuery(
    { clientId: id },
    { skip: clientQuery.isError || clientQuery.isLoading },
  );

  if (clientQuery.isLoading) return <SalesClientDetailLoading />;
  if (clientQuery.isError || !clientQuery.data) {
    const forbidden = isForbidden(clientQuery.error);

    return (
      <main dir="rtl" className="p-4 sm:p-6 lg:p-8">
        <State
          title={forbidden ? "الوصول غير متاح" : "لم يتم العثور على العميل"}
          description={
            forbidden
              ? "ليس لديك صلاحية لعرض بيانات هذا العميل."
              : clientWorkflowErrorMessage(clientQuery.error)
          }
          retry={clientQuery.refetch}
          forbidden={forbidden}
        />
      </main>
    );
  }

  const client = clientQuery.data;
  const relatedNotice = (
    error: unknown,
    forbiddenText: string,
    fallback: string,
    retry: () => void,
  ) =>
    isForbidden(error) ? (
      <State title="الوصول غير متاح" description={forbiddenText} forbidden />
    ) : (
      <State title="تعذر تحميل البيانات" description={fallback} retry={retry} />
    );
  const profileContent = profileQuery.isLoading ? (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  ) : profileQuery.isError ? (
    <State
      title={
        isForbidden(profileQuery.error)
          ? "الوصول غير متاح"
          : "تعذر تحميل الملف التعريفي"
      }
      description={clientWorkflowErrorMessage(profileQuery.error)}
      retry={profileQuery.refetch}
      forbidden={isForbidden(profileQuery.error)}
    />
  ) : editing ? (
    <Card>
      <CardContent className="p-5">
        <ProfileEditTab
          clientId={client.id}
          profile={profileQuery.data ?? null}
        />
      </CardContent>
    </Card>
  ) : undefined;

  return (
    <>
      <SalesClientDetail
        client={client}
        profile={profileQuery.data ?? null}
        projects={projectsQuery.data?.items ?? []}
        contracts={contractsQuery.data?.items ?? []}
        invoices={invoicesQuery.data?.items ?? []}
        projectTotal={projectsQuery.data?.total}
        contractTotal={contractsQuery.data?.total}
        invoiceTotal={invoicesQuery.data?.total}
        profileContent={profileContent}
        onEditProfile={() => setEditing((value) => !value)}
        onNewRequest={() => setNewRequestOpen(true)}
        projectsNotice={
          projectsQuery.isLoading ? (
            <SalesClientDetailLoading />
          ) : projectsQuery.isError ? (
            relatedNotice(
              projectsQuery.error,
              "ليس لديك صلاحية لعرض المشاريع المرتبطة بهذا العميل.",
              clientRelatedErrorMessage(projectsQuery.error),
              projectsQuery.refetch,
            )
          ) : undefined
        }
        contractsNotice={
          contractsQuery.isLoading ? (
            <SalesClientDetailLoading />
          ) : contractsQuery.isError ? (
            relatedNotice(
              contractsQuery.error,
              "ليس لديك صلاحية لعرض العقود المرتبطة بهذا العميل.",
              clientRelatedErrorMessage(contractsQuery.error),
              contractsQuery.refetch,
            )
          ) : undefined
        }
        invoicesNotice={
          invoicesQuery.isLoading ? (
            <SalesClientDetailLoading />
          ) : invoicesQuery.isError ? (
            relatedNotice(
              invoicesQuery.error,
              "ليس لديك صلاحية لعرض السجل المالي لهذا العميل.",
              clientWorkflowErrorMessage(invoicesQuery.error),
              invoicesQuery.refetch,
            )
          ) : undefined
        }
      />
      <NewRequestForClientModal
        client={client}
        open={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
      />
    </>
  );
}
