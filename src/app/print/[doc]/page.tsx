import { notFound } from "next/navigation";
import { getStore } from "@/server/index";
import { DOCS, DOC_KEYS, isDocKey } from "@/components/print/registry";
import { PrintToolbar } from "@/components/print/PrintToolbar";

/** /print/[doc]?id=EXP-6911-0012 — แสดงเอกสาร A4 พร้อมพิมพ์ */
export default async function PrintDocPage({ params, searchParams }: {
  params: Promise<{ doc: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { doc } = await params;
  const { id } = await searchParams;
  if (!isDocKey(doc)) notFound();
  const def = DOCS[doc];
  const options = (await getStore().listExpenses()).filter(def.accepts);
  const e = options.find((x) => x.id === id) ?? options.find((x) => x.id === def.sample) ?? options[0];
  if (!e) notFound();

  return (
    <>
      <PrintToolbar doc={doc} id={e.id}
        docs={DOC_KEYS.map((k) => ({ value: k, label: DOCS[k].title }))}
        options={options.map((o) => ({ value: o.id, label: `${o.id} · ${o.title}` }))} />
      <main className="space-y-8 overflow-x-auto px-4 py-8 print:space-y-0 print:overflow-visible print:p-0">
        {def.render(e)}
      </main>
    </>
  );
}
