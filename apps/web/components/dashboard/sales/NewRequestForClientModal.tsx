"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { useCreateSalesRequestForClientMutation } from "@/features/sales/salesApi";
import { salesWorkflowErrorMessage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  client: {
    id: string;
    companyName: string;
    businessName: string;
    businessType: string;
    user?: { name: string; email: string; phoneWhatsapp: string | null } | null;
  };
  open: boolean;
  onClose: () => void;
}

export function NewRequestForClientModal({ client, open, onClose }: Props) {
  const { data: services } = useGetServicesQuery(undefined, { skip: !open });
  const [createRequest, { isLoading }] =
    useCreateSalesRequestForClientMutation();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const serviceOptions = useMemo(() => services ?? [], [services]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) return;
    setSelectedServices([]);
    setNotes("");
    onClose();
  }

  async function handleSubmit() {
    if (selectedServices.length === 0) {
      toast.error("يرجى اختيار خدمة واحدة على الأقل");
      return;
    }

    try {
      await createRequest({
        clientId: client.id,
        services: selectedServices.map((serviceId) => ({
          serviceId,
          quantity: 1,
        })),
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("تم إنشاء الطلب بنجاح");
      handleOpenChange(false);
    } catch (error) {
      toast.error(salesWorkflowErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب جديد — {client.companyName}</DialogTitle>
          <DialogDescription>
            إنشاء طلب جديد لصالح عميل حالي. بيانات العميل للقراءة فقط.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p>
              <span className="font-medium">الشركة:</span> {client.companyName}
            </p>
            <p>
              <span className="font-medium">جهة الاتصال:</span>{" "}
              {client.user?.name ?? "—"}
            </p>
            <p>
              <span className="font-medium">الهاتف:</span>{" "}
              {client.user?.phoneWhatsapp ?? "—"}
            </p>
            <p>
              <span className="font-medium">نوع النشاط:</span>{" "}
              {client.businessType}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-medium">الخدمات المطلوبة</p>
            <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto">
              {serviceOptions.map((service) => {
                const checked = selectedServices.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setSelectedServices((current) =>
                          value
                            ? [...current, service.id]
                            : current.filter((id) => id !== service.id),
                        );
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{service.nameAr}</p>
                      {service.descriptionAr ? (
                        <p className="text-xs text-muted-foreground">
                          {service.descriptionAr}
                        </p>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium" htmlFor="sales-client-request-notes">
              ملاحظات
            </label>
            <Textarea
              id="sales-client-request-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="وصف المشروع أو ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء الطلب"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
