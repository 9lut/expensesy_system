"use client";

import { useState, type ReactNode } from "react";
import {
  Bell, Building2, FileDigit, Landmark, Lock, ReceiptText, Save, ScanText, Scale, Wallet, Workflow, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const ctl = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

/* ───────── ตัวควบคุมขนาดเล็ก ───────── */
function Toggle({ on: initial = false, locked = false }: { on?: boolean; locked?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button type="button" role="switch" aria-checked={on} disabled={locked} onClick={() => setOn(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-blue-600" : "bg-slate-300"} disabled:opacity-60`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
const Num = ({ v, suffix }: { v: number | string; suffix?: string }) => (
  <div className="flex items-center gap-2"><input inputMode="decimal" defaultValue={v} className={`${ctl} text-right tabular-nums`} />{suffix && <span className="shrink-0 text-xs text-slate-500">{suffix}</span>}</div>
);
const Txt = ({ v, mono, placeholder }: { v?: string; mono?: boolean; placeholder?: string }) => <input defaultValue={v} placeholder={placeholder} className={`${ctl} ${mono ? "font-mono" : ""}`} />;
const Sel = ({ v, opts }: { v: string; opts: string[] }) => <select defaultValue={v} className={ctl}>{opts.map((o) => <option key={o}>{o}</option>)}</select>;
function Checks({ opts, on }: { opts: string[]; on: string[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
      {opts.map((o) => <label key={o} className="flex items-center gap-1.5 text-sm"><input type="checkbox" defaultChecked={on.includes(o)} className="size-4 accent-blue-600" />{o}</label>)}
    </div>
  );
}

/** แถวตั้งค่า: ชื่อ + คำอธิบายซ้าย · ตัวควบคุมขวา */
function Row({ label, hint, children, toggle }: { label: string; hint?: string; children: ReactNode; toggle?: boolean }) {
  return (
    <div className={`grid items-center gap-x-6 gap-y-2 border-b border-slate-100 px-5 py-3 last:border-0 ${toggle ? "grid-cols-[1fr_auto]" : "md:grid-cols-[minmax(0,1fr)_minmax(0,300px)]"}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <div className={toggle ? "" : "min-w-0"}>{children}</div>
    </div>
  );
}

type Section = { id: string; title: string; icon: LucideIcon; desc: string; rows: ReactNode };

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const sections: Section[] = [
    {
      id: "company", title: "ข้อมูลบริษัท", icon: Building2, desc: "ใช้บนใบสำคัญจ่าย รายงาน และ Export",
      rows: <>
        <Row label="ชื่อบริษัท"><Txt v="บริษัท ตัวอย่าง จำกัด" /></Row>
        <Row label="เลขประจำตัวผู้เสียภาษีบริษัท" hint="13 หลัก"><Txt v="0105561234567" mono /></Row>
        <Row label="สาขา"><Txt v="สำนักงานใหญ่" /></Row>
        <Row label="ปีงบประมาณเริ่มเดือน" hint="ใช้แบ่งรายงานรายปี"><Sel v="มกราคม" opts={MONTHS} /></Row>
      </>,
    },
    {
      id: "claim", title: "การเบิกและวงเงิน", icon: ReceiptText, desc: "กฎตอนพนักงานสร้างใบเบิก",
      rows: <>
        <Row label="ค่าน้ำมันรถส่วนตัว" hint="คำนวณจากระยะทาง"><Num v={5} suffix="บาท/กม." /></Row>
        <Row label="เบิกย้อนหลังได้ไม่เกิน" hint="นับจากวันที่ในใบเสร็จ"><Num v={90} suffix="วัน" /></Row>
        <Row label="วงเงินสูงสุดต่อใบเบิก" hint="เว้นว่าง = ไม่จำกัด"><Num v="50000" suffix="บาท" /></Row>
        <Row toggle label="ส่งได้แม้เกินวงเงินของหมวด" hint="ติดป้าย “เกินวงเงิน” ให้หัวหน้าเห็น"><Toggle on /></Row>
        <Row toggle label="บันทึกร่างอัตโนมัติ" hint="ทุก 5 วินาที กันข้อมูลหายเมื่อปิด LINE"><Toggle on /></Row>
      </>,
    },
    {
      id: "approval", title: "ลำดับการอนุมัติ", icon: Workflow, desc: "ใครอนุมัติ และเมื่อไรต้องอนุมัติ 2 ขั้น",
      rows: <>
        <Row label="ผู้อนุมัติ"><Sel v="หัวหน้าตามสายงาน" opts={["หัวหน้าตามสายงาน", "แอดมินคนใดก็ได้"]} /></Row>
        <Row label="อนุมัติ 2 ขั้นเมื่อยอดเกิน" hint="ขั้นที่ 2 = ผู้จัดการฝ่ายบัญชี"><Num v="20000" suffix="บาท" /></Row>
        <Row label="เตือนเมื่อค้างอนุมัติเกิน" hint="แจ้งผู้อนุมัติทาง LINE"><Num v={2} suffix="วัน" /></Row>
        <Row toggle label="ห้ามอนุมัติ/จ่ายใบเบิกของตนเอง" hint="บังคับเสมอ (ตรวจฝั่งเซิร์ฟเวอร์)"><Toggle on locked /></Row>
      </>,
    },
    {
      id: "payment", title: "การจ่ายเงิน", icon: Landmark, desc: "ช่องทางและรอบการจ่าย",
      rows: <>
        <Row label="ช่องทางที่ใช้ได้"><Checks opts={["โอนเงิน", "เงินสด", "เช็ค"]} on={["โอนเงิน", "เงินสด"]} /></Row>
        <Row label="บัญชีที่ใช้จ่ายเงิน"><Txt v="กสิกรไทย 012-3-45678-9 (กระแสรายวัน)" /></Row>
        <Row label="รอบการจ่าย"><Sel v="ทุกวันศุกร์" opts={["ทุกวันทำการ", "ทุกวันศุกร์", "วันที่ 15 และสิ้นเดือน"]} /></Row>
        <Row toggle label="บังคับแนบสลิปเมื่อโอน"><Toggle on /></Row>
      </>,
    },
    {
      id: "advance", title: "เงินยืมล่วงหน้า", icon: Wallet, desc: "วงเงินและกำหนดเคลียร์",
      rows: <>
        <Row label="ต้องส่งใบเสร็จเคลียร์ภายใน" hint="นับจากวันที่รับเงิน"><Num v={15} suffix="วัน" /></Row>
        <Row label="วงเงินยืมสูงสุดต่อครั้ง"><Num v="30000" suffix="บาท" /></Row>
        <Row label="เตือนก่อนครบกำหนด"><Num v={3} suffix="วัน" /></Row>
        <Row toggle label="ห้ามยืมใหม่ถ้ายังมีค้างเคลียร์"><Toggle on /></Row>
      </>,
    },
    {
      id: "tax", title: "ภาษีและผังบัญชี", icon: Scale, desc: "บัญชีที่ใช้ทำรายการบันทึกบัญชีอัตโนมัติ",
      rows: <>
        <Row label="อัตราภาษีมูลค่าเพิ่ม (VAT)"><Num v={7} suffix="%" /></Row>
        <Row label="ค่าใช้จ่ายค้างจ่าย – พนักงาน" hint="เครดิตเมื่ออนุมัติ"><Txt v="2141" mono /></Row>
        <Row label="เงินทดรองจ่ายพนักงาน" hint="เดบิตเมื่ออนุมัติเงินยืม"><Txt v="1141" mono /></Row>
        <Row label="เงินฝากธนาคาร" hint="เครดิตเมื่อจ่ายเงิน"><Txt v="1112" mono /></Row>
        <Row toggle label="แยกภาษีซื้อเมื่อเป็นใบกำกับเต็มรูป" hint="บัญชีภาษีซื้อ 1154 · ฉบับย่อรวมในค่าใช้จ่าย"><Toggle on /></Row>
      </>,
    },
    {
      id: "numbering", title: "เลขที่เอกสาร", icon: FileDigit, desc: "รูปแบบเลขรันนิ่ง",
      rows: <>
        <Row label="ใบเบิกค่าใช้จ่าย" hint="ตัวอย่าง: EXP-6911-0015"><Txt v="EXP-{YY}{MM}-{####}" mono /></Row>
        <Row label="เงินยืมล่วงหน้า" hint="ตัวอย่าง: ADV-6911-0004"><Txt v="ADV-{YY}{MM}-{####}" mono /></Row>
        <Row toggle label="เริ่มนับใหม่ทุกเดือน"><Toggle on /></Row>
      </>,
    },
    {
      id: "ocr", title: "OCR ใบเสร็จ", icon: ScanText, desc: "OpenThai2.1-OCR-Text",
      rows: <>
        <Row toggle label="เปิดใช้การอ่านใบเสร็จอัตโนมัติ"><Toggle on /></Row>
        <Row label="ความมั่นใจขั้นต่ำ" hint="ต่ำกว่านี้ขึ้นเตือน “ไม่แน่ใจ”"><Num v={90} suffix="%" /></Row>
        <Row label="อ่าน PDF ได้สูงสุด"><Num v={3} suffix="หน้า" /></Row>
        <Row toggle label="ตรวจเลขผู้เสียภาษี (check digit)"><Toggle on /></Row>
        <Row toggle label="เตือนเมื่อยอดที่เบิกไม่ตรงใบเสร็จ"><Toggle on /></Row>
      </>,
    },
    {
      id: "line", title: "การแจ้งเตือน LINE", icon: Bell, desc: "LINE OA และเหตุการณ์ที่แจ้ง",
      rows: <>
        <Row label="LIFF ID"><Txt placeholder="2000000000-xxxxxxxx" mono /></Row>
        <Row label="LINE Group ของแอดมิน"><Txt v="Cxxxxxxxxxxxxxxxx" mono /></Row>
        <Row toggle label="ใบเบิกใหม่ → แจ้งกลุ่มแอดมิน"><Toggle on /></Row>
        <Row toggle label="อนุมัติ / ส่งกลับ / ไม่อนุมัติ → แจ้งพนักงาน"><Toggle on /></Row>
        <Row toggle label="จ่ายเงินแล้ว → แจ้งพนักงาน"><Toggle on /></Row>
        <Row toggle label="เงินยืมใกล้ครบ / เกินกำหนด → แจ้งทุกวัน"><Toggle on /></Row>
      </>,
    },
    {
      id: "security", title: "ความปลอดภัย", icon: Lock, desc: "รหัสผ่านและการเข้าสู่ระบบ",
      rows: <>
        <Row label="ความยาวรหัสผ่านขั้นต่ำ"><Num v={8} suffix="ตัวอักษร" /></Row>
        <Row label="ล็อกบัญชีเมื่อใส่ผิด" hint="ล็อก 15 นาที"><Num v={5} suffix="ครั้ง" /></Row>
        <Row label="อายุการเข้าสู่ระบบ (Session)"><Num v={7} suffix="วัน" /></Row>
        <Row toggle label="บังคับเปลี่ยนรหัสผ่านเมื่อเข้าครั้งแรก"><Toggle on /></Row>
      </>,
    },
  ];

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const saveBtn = (
    <button onClick={save} className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
      <Save size={16} /> {saved ? "บันทึกแล้ว ✓" : "บันทึกการตั้งค่า"}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="hidden md:block"><PageHeader title="ตั้งค่าระบบ" subtitle="ค่าเหล่านี้มีผลกับทุกใบเบิก — เปลี่ยนแล้วบันทึกใน Audit Log" actions={saveBtn} /></div>
      <div className="grid items-start gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
        {/* เมนูหมวด (คอม) */}
        <nav className="sticky top-0 hidden space-y-0.5 md:block">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-900">
              <s.icon size={16} className="text-slate-400" /> {s.title}
            </a>
          ))}
        </nav>
        <div className="space-y-4">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                <s.icon size={17} className="text-slate-500" />
                <div><h2 className="text-sm font-bold">{s.title}</h2><p className="text-xs text-slate-500">{s.desc}</p></div>
              </header>
              {s.rows}
            </section>
          ))}
          <div className="md:hidden">{saveBtn}</div>
        </div>
      </div>
    </div>
  );
}
