"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, MessageSquare, EyeOff, Download } from "lucide-react";
import { FormInputControl } from "@/components/design-system/FormInputControl";
import { ActionButton } from "@/components/design-system/ActionButton";
import { PageIntro } from "@/components/design-system/PageIntro";
import { DataTable } from "@/components/design-system/DataTable";
import { Pill } from "@/components/design-system/Pill";
import { Dialog } from "@/components/design-system/Dialog";
import { toast } from "sonner";
import { useGetAdminConversationsQuery, useGetAdminConversationMessagesQuery, useHideConversationMutation, type ConversationRow } from "@/features/admin/adminApi";

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function AdminChatPage() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedConv, setSelectedConv] = useState<ConversationRow | null>(null);
  const [showMessages, setShowMessages] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { data, isLoading, isError } = useGetAdminConversationsQuery({ search: debouncedSearch || undefined });
  const { data: messagesData } = useGetAdminConversationMessagesQuery(
    { id: selectedConv?.id ?? "", limit: 50 },
    { skip: !selectedConv },
  );
  const [hideConv] = useHideConversationMutation();

  const conversations = data?.items ?? [];

  const handleHide = async (id: string) => {
    try { await hideConv(id).unwrap(); toast.success("تم إخفاء المحادثة"); } catch { toast.error("فشل"); }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <PageIntro title="المحادثات" description={`إجمالي ${data?.total ?? 0} محادثة`} icon={MessageSquare} />
      <div className="relative flex-1 max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-portal-icon" />
        <FormInputControl placeholder="ابحث عن محادثة..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pr-9" />
      </div>

      <DataTable
        columns={[
          { id: "participants", label: "المشاركون" }, { id: "lastMessage", label: "آخر رسالة" },
          { id: "messages", label: "الرسائل" }, { id: "status", label: "الحالة" },
          { id: "lastActive", label: "آخر نشاط", align: "left" }, { id: "actions", label: "الإجراءات", width: "100px" },
        ]}
        data={conversations} isLoading={isLoading} isError={isError}
        emptyState={{ icon: MessageSquare, message: "لا توجد محادثات", hint: "لم يتم إنشاء أي محادثات بعد" }}
        renderRow={(c: ConversationRow) => (
          <tr key={c.id} className="border-b border-portal-divider">
            <td className="px-5 py-4 text-sm text-natural-100">{c.participants.map((p) => p.name).join("، ")}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text max-w-[200px] truncate">{c.lastMessageContent ?? "—"}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text">{c.messageCount}</td>
            <td className="px-5 py-4">{c.isStale ? <Pill tone="warning">خاملة</Pill> : <Pill tone="success">نشطة</Pill>}</td>
            <td className="px-5 py-4 text-sm text-portal-note-text text-left" dir="ltr">{c.lastMessageAt?.slice(0, 10) ?? "—"}</td>
            <td className="px-5 py-4">
              <div className="flex gap-1">
                <ActionButton variant="ghost" size="sm" className="h-8 w-8" title="عرض الرسائل" onClick={() => { setSelectedConv(c); setShowMessages(true); }}><MessageSquare className="size-3.5" /></ActionButton>
                <ActionButton variant="ghost" size="sm" className="h-8 w-8" title="إخفاء" onClick={() => handleHide(c.id)}><EyeOff className="size-3.5" /></ActionButton>
              </div>
            </td>
          </tr>
        )}
      />

      <Dialog open={showMessages} onOpenChange={setShowMessages}
        title="الرسائل" contentClassName="sm:max-w-2xl max-h-[80vh] overflow-y-auto"
        footer={<ActionButton onClick={() => setShowMessages(false)}>إغلاق</ActionButton>}>
        <div className="space-y-3">
          {(messagesData?.items ?? []).map((m: any) => (
            <div key={m.id} className="rounded-2xl border border-portal-divider p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-natural-100">{m.senderName}</span>
                <span className="text-xs text-portal-note-text" dir="ltr">{m.createdAt?.slice(0, 16) ?? ""}</span>
              </div>
              <p className="text-sm text-portal-icon">{m.content}</p>
              {m.attachments?.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {m.attachments.map((a: any) => (
                    <span key={a.id} className="text-xs text-secondary-500">{a.fileName}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(!messagesData?.items || messagesData.items.length === 0) && (
            <p className="text-center text-portal-note-text py-8">لا توجد رسائل</p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
