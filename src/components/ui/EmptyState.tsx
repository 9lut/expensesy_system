import { Inbox } from "lucide-react";

export function EmptyState({ text = "ไม่พบรายการ" }: { text?: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-slate-400">
      <Inbox size={36} /> {text}
    </div>
  );
}
