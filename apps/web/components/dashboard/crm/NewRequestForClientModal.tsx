"use client";

import { useState } from "react";
import { useGetServicesQuery } from "@/features/services/servicesApi";
import { useCreateRequestForClientMutation } from "@/features/requests/requestsApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  client: {
    id: string;
    companyName: string;
    businessName: string;
    businessType: string;
    // Personal identity now on `User` (joined via userId).
    user?: { name: string; email: string; phoneWhatsapp: string | null } | null;
  };
  open: boolean;
  onClose: () => void;
}

export function NewRequestForClientModal({ client, open, onClose }: Props) {
  const { data: services } = useGetServicesQuery(undefined);
  const [createRequest, { isLoading }] = useCreateRequestForClientMutation();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      toast.error("يرجى اختيار خدمة واحدة على الأقل");
      return;
    }
    try {
      await createRequest({
        clientId: client.id,
        services: selectedServices.map((id) => ({ serviceId: id, quantity: 1 })),
        notes: notes || undefined,
      }).unwrap();
      toast.success("تم إنشاء الطلب بنجاح");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "فشل إنشاء الطلب");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب جديد — {client.companyName}</DialogTitle>
          <DialogDescription>
            إنشاء طلب جديد لصالح عميل حالي. بيانات العميل مقروءة فقط.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
            <p><span className="font-medium">الشركة:</span> {client.companyName}</p>
            <p><span className="font-medium">جهة الاتصال:</span> {client.user?.name ?? "—"}</p>
            <p><span className="font-medium">الهاتف:</span> {client.user?.phoneWhatsapp ?? "—"}</p>
            <p><span className="font-medium">نوع النشاط:</span> {client.businessType}</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">الخدمات المطلوبة</p>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {services?.map((service: any) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedServices((prev) => [...prev, service.id]);
                      } else {
                        setSelectedServices((prev) => prev.filter((id) => id !== service.id));
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{service.nameAr}</p>
                    {service.descriptionAr && (
                      <p className="text-xs text-muted-foreground">{service.descriptionAr}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium">ملاحظات</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="وصف المشروع أو ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
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
