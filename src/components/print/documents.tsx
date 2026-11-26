/* eslint-disable @next/next/no-img-element -- โลโก้ SVG ในเอกสารพิมพ์ */
import type { ReactNode } from "react";
import { BANK_ACCOUNTS, CATEGORIES, CURRENT_ADMIN, EMPLOYEES, LEDGER } from "@/lib/mock";
import { COMPANY } from "@/lib/company";
import { TYPE_META } from "@/lib/meta";
import { bahtText, money, thDateLong } from "@/lib/thai";
import type { Expense } from "@/lib/types";
import { Box, Dot, Footer, Letterhead, Line, Paper, Sign, tbl } from "./Paper";

/* ───────────── ข้อมูลประกอบ ───────────── */
const who = (e: Expense) => EMPLOYEES.find((x) => x.id === e.employeeId);
const approverOf = (e: Expense) => EMPLOYEES.find((x) => x.name === e.approver) ?? CURRENT_ADMIN;
const catOf = (name: string) => CATEGORIES.find((c) => c.name === name);
const receipts = (e: Expense) => e.items.reduce((a, i) => a + i.receipts, 0);
const span = (e: Expense) => {
  const d = e.items.map((i) => i.date).sort();
  return { first: d[0] ?? e.createdAt, last: d[d.length - 1] ?? e.createdAt };
};
const days = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000) + 1;
/** แยกบาท / สตางค์ สำหรับตารางแบบราชการ */
const bs = (n: number) => money(n).split(".") as [string, string];

/** ย่อหน้าแบบหนังสือราชการ (เยื้อง 2.5 ซม.) */
const P = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`indent-[25mm] ${className}`}>{children}</p>
);

/** แถวเปล่าเติมตารางให้เต็ม */
const pad = (n: number, cols: number) =>
  Array.from({ length: Math.max(0, n) }, (_, i) => (
    <tr key={`pad-${i}`}>{Array.from({ length: cols }, (_, j) => <td key={j}>&nbsp;</td>)}</tr>
  ));

/** กล่องลงนามมีกรอบ */
const SignCell = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="border border-black px-[3mm] pb-[2mm] pt-[1.5mm] text-[10.5pt]">
    <p className="mb-[5mm] font-bold">{title}</p>
    {children}
  </div>
);

/** แถวลายมือชื่อ 4 ช่องในกรอบเดียว (แบบฟอร์มบัญชี) */
const SignRow = ({ signers, className = "" }: { signers: { t: string; n?: string; d?: string }[]; className?: string }) => (
  <div className={`grid border border-black text-center text-[10pt] ${className}`} style={{ gridTemplateColumns: `repeat(${signers.length}, minmax(0, 1fr))` }}>
    {signers.map((x, i) => (
      <div key={x.t} className={`px-[2mm] pb-[2mm] pt-[1mm] ${i ? "border-l border-black" : ""}`}>
        <p className="font-bold">{x.t}</p>
        <p className="mt-[12mm] border-b border-dotted border-black">&nbsp;</p>
        <p className="mt-[1mm] whitespace-nowrap">( {x.n || <Dot w="24mm" />} )</p>
        <p className="whitespace-nowrap">วันที่ <Dot w="20mm">{x.d}</Dot></p>
      </div>
    ))}
  </div>
);

/* ═════════════ 1. บันทึกข้อความ ขออนุมัติเบิกค่าใช้จ่าย ═════════════ */
export function MemoDoc({ e }: { e: Expense }) {
  const u = who(e);
  const a = approverOf(e);
  const { first, last } = span(e);
  return (
    <Paper>
      <div className="relative mb-[3mm] flex items-end">
        <img src="/brand/logo-mark.svg" alt="" className="size-[15mm] grayscale" />
        <h1 className="absolute inset-x-0 bottom-0 text-center text-[22pt] font-bold leading-none">บันทึกข้อความ</h1>
      </div>
      <div className="space-y-[1mm]">
        <Line label={<b className="text-[14pt]">ส่วนงาน</b>}>{e.department} {COMPANY.name} โทร {COMPANY.phone}</Line>
        <div className="flex gap-[6mm]">
          <div className="flex-1"><Line label={<b className="text-[14pt]">ที่</b>}>{COMPANY.short} {e.id}</Line></div>
          <div className="flex-1"><Line label={<b className="text-[14pt]">วันที่</b>}>{thDateLong(e.createdAt)}</Line></div>
        </div>
        <Line label={<b className="text-[14pt]">เรื่อง</b>}>ขออนุมัติเบิก{TYPE_META[e.type].label}</Line>
      </div>
      <hr className="my-[3mm] border-black" />

      <p className="mb-[2mm]">เรียน&nbsp;&nbsp;{a.position}</p>
      <div className="mb-[3mm] flex gap-2">
        <span className="shrink-0">สิ่งที่ส่งมาด้วย</span>
        <ol className="list-inside list-decimal">
          <li>ใบเบิกค่าใช้จ่าย เลขที่ {e.id} จำนวน 1 ฉบับ</li>
          <li>หลักฐานการจ่ายเงิน (ใบเสร็จรับเงิน / ใบกำกับภาษี) จำนวน {receipts(e)} ฉบับ</li>
        </ol>
      </div>

      <P>
        ด้วยข้าพเจ้า {e.employee} ตำแหน่ง{u?.position} สังกัด{e.department} ได้สำรองจ่ายเงินส่วนตัวเป็นค่าใช้จ่ายในการ{e.title}
        {first === last ? ` เมื่อวันที่ ${thDateLong(first)}` : ` ระหว่างวันที่ ${thDateLong(first)} ถึงวันที่ ${thDateLong(last)}`} จำนวน {e.items.length} รายการ
        เป็นเงินทั้งสิ้น {money(e.total)} บาท ({bahtText(e.total)}) รายละเอียดปรากฏตามสิ่งที่ส่งมาด้วย
      </P>
      <P className="mt-[2mm]">
        ในการนี้ ข้าพเจ้าได้ตรวจสอบแล้วว่าค่าใช้จ่ายดังกล่าวเกิดขึ้นจากการปฏิบัติงานของบริษัทจริง และเป็นไปตามระเบียบการเบิกค่าใช้จ่ายของบริษัท
        จึงขออนุมัติเบิกเงินจำนวนดังกล่าว โดยขอให้โอนเข้าบัญชี{BANK_ACCOUNTS[e.employeeId] ? `ธนาคาร${BANK_ACCOUNTS[e.employeeId].bank} เลขที่ ${BANK_ACCOUNTS[e.employeeId].no}` : "ที่ให้ไว้กับบริษัท"}
      </P>
      <P className="mt-[2mm]">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</P>

      <div className="ml-auto mt-[8mm] w-[85mm] text-center">
        <p>ลงชื่อ<Dot w="50mm" /></p>
        <p>( {e.employee} )</p>
        <p>{u?.position}</p>
      </div>

      <div className="mt-[8mm] grid grid-cols-2 gap-[4mm] text-[11.5pt]">
        <SignCell title="ความเห็นผู้บังคับบัญชา">
          <p><Box>เห็นควรอนุมัติ</Box></p>
          <p><Box>ส่งกลับแก้ไข</Box></p>
          <p className="mt-[1mm] border-b border-dotted border-black">&nbsp;</p>
          <div className="mt-[6mm] text-center">
            <p>ลงชื่อ<Dot w="40mm" /></p>
            <p>( {a.name} )</p>
            <p>{a.position}</p>
          </div>
        </SignCell>
        <SignCell title="คำสั่งผู้มีอำนาจอนุมัติ">
          <p><Box>อนุมัติ</Box><Box>ไม่อนุมัติ</Box></p>
          <p className="mt-[1mm] border-b border-dotted border-black">&nbsp;</p>
          <p className="border-b border-dotted border-black">&nbsp;</p>
          <div className="mt-[6mm] text-center">
            <p>ลงชื่อ<Dot w="40mm" /></p>
            <p>( {COMPANY.md.name} )</p>
            <p>{COMPANY.md.position}</p>
          </div>
        </SignCell>
      </div>
      <Footer refNo={e.id} />
    </Paper>
  );
}

/* ═════════════ 2. ใบเบิกค่าใช้จ่าย ═════════════ */
export function ClaimDoc({ e }: { e: Expense }) {
  const u = who(e);
  const a = approverOf(e);
  const bank = BANK_ACCOUNTS[e.employeeId];
  return (
    <Paper>
      <Letterhead title="ใบเบิกค่าใช้จ่าย" subtitle="EXPENSE CLAIM FORM"
        no={<><p>เลขที่ <b>{e.id}</b></p><p>วันที่ {thDateLong(e.createdAt)}</p></>} />

      <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[1mm] text-[11.5pt]">
        <Line label="ชื่อผู้เบิก">{e.employee}</Line>
        <Line label="รหัสพนักงาน">{e.employeeId}</Line>
        <Line label="ตำแหน่ง">{u?.position}</Line>
        <Line label="ฝ่าย">{e.department}</Line>
        <div className="col-span-2"><Line label="เรื่อง">{e.title}</Line></div>
        <div className="col-span-2 mt-[1mm]">
          ประเภท&nbsp;&nbsp;<Box checked={e.type === "travel"}>ค่าเดินทาง</Box><Box checked={e.type === "general"}>ค่าใช้จ่ายทั่วไป</Box><Box>อื่น ๆ</Box>
        </div>
      </div>

      <table className={`${tbl} mt-[4mm]`}>
        <thead>
          <tr className="bg-black/5">
            <th className="w-[10mm]">ที่</th><th className="w-[26mm]">วันที่</th><th>รายการ</th>
            <th className="w-[34mm]">รหัสบัญชี</th><th className="w-[16mm]">หลักฐาน</th><th className="w-[30mm]">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {e.items.map((it, i) => {
            const c = catOf(it.category);
            return (
              <tr key={i}>
                <td className="text-center">{i + 1}</td>
                <td className="text-center">{new Date(it.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</td>
                <td>{it.description}<span className="block text-[9pt] text-black/60">{it.category}</span></td>
                <td className="text-center">{c?.accountCode} <span className="text-[9pt]">{c?.accountName}</span></td>
                <td className="text-center">{it.receipts || "-"}</td>
                <td className="text-right tabular-nums">{money(it.amount)}</td>
              </tr>
            );
          })}
          {pad(7 - e.items.length, 6)}
          <tr className="font-bold">
            <td colSpan={5} className="text-center">({bahtText(e.total)})</td>
            <td className="text-right tabular-nums">{money(e.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-[3mm] text-[11.5pt]">
        <p>การรับเงิน&nbsp;&nbsp;<Box checked={!!bank}>โอนเข้าบัญชี {bank ? `ธนาคาร${bank.bank} เลขที่ ${bank.no} ชื่อบัญชี ${bank.name}` : <Dot w="70mm" />}</Box></p>
        <p className="ml-[22mm]"><Box checked={!bank}>เงินสด</Box></p>
        <p className="mt-[1mm]">ข้าพเจ้าขอรับรองว่าค่าใช้จ่ายข้างต้นได้จ่ายไปเพื่อกิจการของบริษัทจริง และแนบหลักฐานการจ่ายจำนวน {receipts(e)} ฉบับ</p>
      </div>

      <SignRow className="mt-[5mm]" signers={[
        { t: "ผู้ขอเบิก", n: e.employee, d: thDateLong(e.createdAt) },
        { t: "ผู้บังคับบัญชา (อนุมัติ)", n: a.name },
        { t: "ผู้ตรวจสอบ (บัญชี)", n: COMPANY.accountant.name },
        { t: "ผู้อนุมัติจ่าย", n: COMPANY.md.name },
      ]} />
      <Footer refNo={e.id} />
    </Paper>
  );
}

/* ═════════════ 3. ใบเบิกค่าใช้จ่ายในการเดินทาง ═════════════ */
const TRAVEL_GROUPS: { label: string; cats: string[] }[] = [
  { label: "ค่าเบี้ยเลี้ยงเดินทาง", cats: ["ค่าเบี้ยเลี้ยง"] },
  { label: "ค่าเช่าที่พัก", cats: ["ค่าที่พัก"] },
  { label: "ค่าพาหนะ (น้ำมัน ทางด่วน ที่จอดรถ แท็กซี่ ตั๋วโดยสาร)", cats: ["ค่าน้ำมัน", "ค่าทางด่วน / ที่จอดรถ", "ค่าแท็กซี่ / รถรับจ้าง", "ค่าตั๋วเดินทาง"] },
];

export function TravelDoc({ e }: { e: Expense }) {
  const u = who(e);
  const a = approverOf(e);
  const { first, last } = span(e);
  const sum = (cats: string[]) => e.items.filter((i) => cats.includes(i.category)).reduce((s, i) => s + i.amount, 0);
  const known = TRAVEL_GROUPS.flatMap((g) => g.cats);
  const rows = [...TRAVEL_GROUPS.map((g) => ({ label: g.label, amt: sum(g.cats) })), { label: "ค่าใช้จ่ายอื่นที่จำเป็นในการเดินทาง", amt: e.items.filter((i) => !known.includes(i.category)).reduce((s, i) => s + i.amount, 0) }];
  return (
    <Paper className="text-[11.5pt]">
      <div className="flex items-start justify-between text-[10pt]">
        <span className="border border-black px-[2mm]">แบบ ค.1 · ส่วนที่ 1</span>
        <div className="text-right">
          <p>สัญญายืมเงินเลขที่ <Dot w="30mm" /></p>
          <p>วันที่ <Dot w="38mm" /></p>
        </div>
      </div>
      <h1 className="mt-[2mm] text-center text-[16pt] font-bold">ใบเบิกค่าใช้จ่ายในการเดินทางไปปฏิบัติงาน</h1>
      <div className="ml-auto mt-[2mm] w-[85mm]">
        <Line label="ที่ทำการ">{COMPANY.name}</Line>
        <Line label="วันที่">{thDateLong(e.createdAt)}</Line>
      </div>
      <p className="mt-[2mm]"><b>เรื่อง</b>&nbsp;&nbsp;ขออนุมัติเบิกค่าใช้จ่ายในการเดินทางไปปฏิบัติงาน</p>
      <p><b>เรียน</b>&nbsp;&nbsp;{a.position}</p>

      <P className="mt-[2mm]">
        ตามที่ข้าพเจ้า {e.employee} ตำแหน่ง{u?.position} สังกัด{e.department} ได้รับอนุมัติให้เดินทางไปปฏิบัติงานเรื่อง {e.title}
      </P>
      <p className="mt-[1mm]">
        โดยออกเดินทางจาก <Box>บ้านพัก</Box><Box checked>สำนักงาน</Box> ตั้งแต่วันที่ <Dot w="32mm">{thDateLong(first)}</Dot> เวลา <Dot w="10mm" /> น.
      </p>
      <p>
        และกลับถึง <Box>บ้านพัก</Box><Box checked>สำนักงาน</Box> วันที่ <Dot w="32mm">{thDateLong(last)}</Dot> เวลา <Dot w="10mm" /> น.
      </p>
      <p>รวมเวลาไปปฏิบัติงานครั้งนี้ <Dot w="14mm">{days(first, last)}</Dot> วัน <Dot w="14mm" /> ชั่วโมง</p>
      <p className="mt-[1mm]">ข้าพเจ้าขอเบิกค่าใช้จ่ายในการเดินทางสำหรับ <Box checked>ข้าพเจ้า</Box><Box>คณะเดินทาง</Box> ดังนี้</p>

      <div className="ml-[10mm] mt-[1mm] space-y-[0.5mm]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-2">
            <span className="flex-1">{r.label}</span>
            <span className="w-[16mm] text-right">เป็นเงิน</span>
            <Dot w="34mm" className="text-right tabular-nums">{r.amt ? money(r.amt) : "-"}</Dot>
            <span>บาท</span>
          </div>
        ))}
        <div className="flex items-baseline gap-2 font-bold">
          <span className="flex-1 text-right">รวมเงินทั้งสิ้น</span>
          <Dot w="34mm" className="text-right tabular-nums">{money(e.total)}</Dot>
          <span>บาท</span>
        </div>
      </div>
      <p className="mt-[1mm]">จำนวนเงิน (ตัวอักษร) <Dot w="120mm">{bahtText(e.total)}</Dot></p>

      <P className="mt-[2mm]">
        ข้าพเจ้าขอรับรองว่ารายการที่กล่าวมาข้างต้นเป็นความจริง และหลักฐานการจ่ายที่ส่งมาด้วย จำนวน {receipts(e)} ฉบับ
        รวมทั้งจำนวนเงินที่ขอเบิกถูกต้องตามระเบียบทุกประการ
      </P>
      <div className="ml-auto mt-[3mm] w-[90mm]"><Sign role="ผู้ขอรับเงิน" name={e.employee} position={u?.position} /></div>

      <div className="mt-[3mm] grid grid-cols-2 gap-[3mm]">
        <SignCell title="ผู้ตรวจสอบ">
          <p className="text-[10pt]">ได้ตรวจสอบหลักฐานการเบิกจ่ายที่แนบถูกต้องแล้ว เห็นควรอนุมัติให้เบิกจ่ายได้</p>
          <Sign role="" name={COMPANY.accountant.name} className="mt-[3mm]" />
        </SignCell>
        <SignCell title="ผู้อนุมัติ">
          <p className="text-[10pt]">อนุมัติให้จ่ายได้</p>
          <p className="text-[10pt]">&nbsp;</p>
          <Sign role="" name={a.name} className="mt-[3mm]" />
        </SignCell>
      </div>

      <div className="mt-[3mm] border border-black px-[3mm] py-[2mm] text-[10.5pt]">
        <p>ได้รับเงินค่าใช้จ่ายในการเดินทาง จำนวน <Dot w="28mm">{money(e.total)}</Dot> บาท (<Dot w="80mm">{bahtText(e.total)}</Dot>) ไว้เป็นการถูกต้องแล้ว</p>
        <div className="mt-[2mm] flex justify-around">
          <p>ลงชื่อ<Dot w="38mm" />ผู้รับเงิน</p>
          <p>ลงชื่อ<Dot w="38mm" />ผู้จ่ายเงิน</p>
        </div>
      </div>
      <Footer refNo={e.id} />
    </Paper>
  );
}

/* ═════════════ 4. ใบสำคัญรับเงิน ═════════════ */
export function ReceiptDoc({ e }: { e: Expense }) {
  const noReceipt = e.items.filter((i) => i.receipts === 0);
  const items = noReceipt.length ? noReceipt : e.items;
  const total = items.reduce((a, i) => a + i.amount, 0);
  const d = new Date(e.createdAt);
  const [tb, ts] = bs(total);
  return (
    <Paper>
      <h1 className="text-center text-[19pt] font-bold">ใบสำคัญรับเงิน</h1>
      <div className="ml-auto mt-[3mm] w-[95mm] space-y-[1mm]">
        <Line label="ที่ทำการ">{COMPANY.name}</Line>
        <p>
          วันที่ <Dot w="12mm">{d.getDate()}</Dot> เดือน <Dot w="28mm">{d.toLocaleDateString("th-TH", { month: "long" })}</Dot> พ.ศ. <Dot w="16mm">{d.getFullYear() + 543}</Dot>
        </p>
      </div>

      <div className="mt-[6mm] space-y-[1.5mm]">
        <Line label="ข้าพเจ้า">{e.employee}</Line>
        <Line label="อยู่บ้านเลขที่" />
        <div className="flex items-baseline gap-2">
          <span className="shrink-0">เลขประจำตัวประชาชน</span>
          <span className="flex gap-[1mm]">
            {Array.from({ length: 13 }, (_, i) => <span key={i} className={`inline-block size-[6mm] border border-black ${[0, 4, 9, 11].includes(i) ? "mr-[2mm]" : ""}`} />)}
          </span>
        </div>
        <p>ได้รับเงินจาก <b>{COMPANY.name}</b> ดังรายการต่อไปนี้</p>
      </div>

      <table className={`${tbl} mt-[3mm] text-[11.5pt]`}>
        <thead>
          <tr className="bg-black/5">
            <th rowSpan={2}>รายการ</th>
            <th colSpan={2} className="w-[42mm]">จำนวนเงิน</th>
          </tr>
          <tr className="bg-black/5"><th className="w-[30mm]">บาท</th><th className="w-[12mm]">สต.</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const [b, s] = bs(it.amount);
            return (
              <tr key={i}>
                <td>{it.description} ({it.category}) วันที่ {thDateLong(it.date)}</td>
                <td className="text-right tabular-nums">{b}</td>
                <td className="text-center tabular-nums">{s}</td>
              </tr>
            );
          })}
          {pad(8 - items.length, 3)}
          <tr className="font-bold">
            <td className="text-right">รวมเงิน</td>
            <td className="text-right tabular-nums">{tb}</td>
            <td className="text-center tabular-nums">{ts}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-[3mm]">จำนวนเงิน (ตัวอักษร) <Dot w="125mm">{bahtText(total)}</Dot></p>
      <p className="mt-[1mm] text-[10.5pt]">หมายเหตุ ใช้แทนใบเสร็จรับเงินสำหรับรายการที่ผู้รับเงินไม่สามารถออกใบเสร็จได้ (อ้างอิงใบเบิกเลขที่ {e.id})</p>

      <div className="mt-[14mm] grid grid-cols-2 gap-[6mm]">
        <Sign role="ผู้รับเงิน" name={e.employee} />
        <Sign role="ผู้จ่ายเงิน" name={COMPANY.accountant.name} />
      </div>
      <Footer refNo={e.id} />
    </Paper>
  );
}

/* ═════════════ 5. ใบสำคัญจ่าย ═════════════ */
export function VoucherDoc({ e }: { e: Expense }) {
  const advance = e.type === "advance";
  const pay = e.payment;
  // เดบิต: บัญชีค่าใช้จ่ายตามหมวด (เงินยืม → เงินทดรองจ่าย) · เครดิต: เงินฝากธนาคาร
  const debit = advance
    ? [{ code: LEDGER.advance.code, name: LEDGER.advance.name, amt: e.total }]
    : Object.values(e.items.reduce<Record<string, { code: string; name: string; amt: number }>>((acc, it) => {
        const c = catOf(it.category);
        const k = c?.accountCode ?? "-";
        acc[k] = { code: k, name: c?.accountName ?? it.category, amt: (acc[k]?.amt ?? 0) + it.amount };
        return acc;
      }, {}));
  const pv = e.id.replace(/^(EXP|ADV)/, "PV");
  return (
    <Paper>
      <Letterhead title="ใบสำคัญจ่าย" subtitle="PAYMENT VOUCHER"
        no={<><p>เลขที่ <b>{pv}</b></p><p>วันที่ {pay ? thDateLong(pay.at) : <Dot w="30mm" />}</p></>} />

      <div className="space-y-[1mm] text-[11.5pt]">
        <Line label="จ่ายให้">{e.employee} ({e.employeeId}) · {e.department}</Line>
        <Line label="รายการ">{advance ? "จ่ายเงินยืมทดรองจ่าย — " : "จ่ายคืนค่าใช้จ่าย — "}{e.title}</Line>
        <Line label="อ้างอิงเอกสาร">{advance ? "สัญญายืมเงิน" : "ใบเบิกค่าใช้จ่าย"} เลขที่ {e.id} ลงวันที่ {thDateLong(e.createdAt)}</Line>
      </div>

      <table className={`${tbl} mt-[4mm]`}>
        <thead>
          <tr className="bg-black/5"><th className="w-[24mm]">รหัสบัญชี</th><th>ชื่อบัญชี</th><th className="w-[32mm]">เดบิต</th><th className="w-[32mm]">เครดิต</th></tr>
        </thead>
        <tbody>
          {debit.map((r) => (
            <tr key={r.code}><td className="text-center">{r.code}</td><td>{r.name}</td><td className="text-right tabular-nums">{money(r.amt)}</td><td /></tr>
          ))}
          <tr><td className="text-center">{LEDGER.bank.code}</td><td className="pl-[10mm]">{LEDGER.bank.name}</td><td /><td className="text-right tabular-nums">{money(e.total)}</td></tr>
          {pad(6 - debit.length, 4)}
          <tr className="font-bold">
            <td colSpan={2} className="text-center">({bahtText(e.total)})</td>
            <td className="text-right tabular-nums">{money(e.total)}</td>
            <td className="text-right tabular-nums">{money(e.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-[4mm] space-y-[1mm] text-[11.5pt]">
        <p>
          จ่ายโดย&nbsp;&nbsp;<Box checked={pay?.method === "เงินสด"}>เงินสด</Box><Box checked={pay?.method === "โอนเงิน"}>โอนเงิน</Box><Box>เช็ค</Box>
        </p>
        <div className="grid grid-cols-2 gap-x-[6mm]">
          <Line label="จากบัญชี">{COMPANY.payBank}</Line>
          <Line label="เลขที่อ้างอิง">{pay?.ref}</Line>
        </div>
      </div>

      <SignRow className="mt-[6mm]" signers={[
        { t: "ผู้จัดทำ", n: COMPANY.accountant.name },
        { t: "ผู้ตรวจสอบ" },
        { t: "ผู้อนุมัติ", n: COMPANY.md.name },
        { t: "ผู้รับเงิน", n: e.employee },
      ]} />
      <Footer refNo={pv} />
    </Paper>
  );
}

/* ═════════════ 6. สัญญาการยืมเงิน (2 หน้า) ═════════════ */
export function LoanDoc({ e }: { e: Expense }) {
  const u = who(e);
  const a = approverOf(e);
  const due = e.advanceDueDate;
  const actual = e.advanceActual;
  const pay = e.payment;
  const box = "mt-[3mm] border border-black px-[3mm] py-[2mm] text-[10.5pt]";
  return (
    <>
      <Paper className="text-[11.5pt]">
        <div className="flex items-start justify-between text-[10.5pt]">
          <span className="border border-black px-[2mm]">แบบ ย.1</span>
          <div className="text-right">
            <p>เลขที่ <Dot w="34mm">{e.id}</Dot></p>
            <p>วันครบกำหนด <Dot w="34mm">{due ? thDateLong(due) : ""}</Dot></p>
          </div>
        </div>
        <h1 className="text-center text-[18pt] font-bold leading-tight">สัญญาการยืมเงิน</h1>
        <p className="mt-[2mm]">ยื่นต่อ <Dot w="120mm" center={false}>{COMPANY.md.position} {COMPANY.name}</Dot></p>

        <P className="mt-[2mm]">
          ข้าพเจ้า {e.employee} ตำแหน่ง{u?.position} สังกัด{e.department} มีความประสงค์ขอยืมเงินจาก{COMPANY.name}
          เพื่อเป็นค่าใช้จ่ายในการ{e.title} ดังรายละเอียดต่อไปนี้
        </P>
        <table className={`${tbl} mt-[2mm]`}>
          <thead><tr className="bg-black/5"><th>รายละเอียด</th><th className="w-[36mm]">จำนวนเงิน (บาท)</th></tr></thead>
          <tbody>
            {e.items.map((it, i) => <tr key={i}><td>{it.description}</td><td className="text-right tabular-nums">{money(it.amount)}</td></tr>)}
            {pad(3 - e.items.length, 2)}
            <tr className="font-bold"><td className="text-right">รวมเงิน</td><td className="text-right tabular-nums">{money(e.total)}</td></tr>
          </tbody>
        </table>
        <p className="mt-[1mm]">จำนวนเงิน (ตัวอักษร) <Dot w="118mm">{bahtText(e.total)}</Dot></p>

        <P className="mt-[2mm] text-[11pt]">
          ข้าพเจ้าสัญญาว่าจะปฏิบัติตามระเบียบของบริษัทว่าด้วยการยืมเงินทดรองจ่ายทุกประการ และจะนำใบสำคัญคู่จ่ายที่ถูกต้อง
          พร้อมทั้งเงินเหลือจ่าย (ถ้ามี) ส่งใช้ภายในวันที่ {due ? thDateLong(due) : "................"} ถ้าข้าพเจ้าไม่ส่งตามกำหนด
          ข้าพเจ้ายินยอมให้หักเงินเดือน ค่าจ้าง หรือเงินอื่นใดที่ข้าพเจ้าพึงได้รับจากบริษัท เพื่อชดใช้จำนวนเงินที่ยืมไปจนครบถ้วนได้ทันที
        </P>
        <div className="ml-auto mt-[2mm] w-[90mm]"><Sign role="ผู้ยืม" name={e.employee} date={thDateLong(e.createdAt)} /></div>

        <div className={box}>
          <p><b>เสนอ</b> {COMPANY.md.position}</p>
          <p className="indent-[10mm]">ได้ตรวจสอบแล้ว เห็นสมควรอนุมัติให้ยืมตามใบยืมฉบับนี้ได้ จำนวน <Dot w="26mm">{money(e.total)}</Dot> บาท (<Dot w="62mm">{bahtText(e.total)}</Dot>)</p>
          <div className="mt-[2mm] flex justify-end"><p>ลงชื่อ<Dot w="40mm" />ผู้ตรวจสอบ ( {COMPANY.accountant.name} ) วันที่<Dot w="24mm" /></p></div>
        </div>
        <div className={box}>
          <p><b>คำอนุมัติ</b></p>
          <p className="indent-[10mm]">อนุมัติให้ยืมตามเงื่อนไขข้างต้นได้ เป็นเงิน <Dot w="26mm">{money(e.total)}</Dot> บาท (<Dot w="62mm">{bahtText(e.total)}</Dot>)</p>
          <div className="mt-[2mm] flex justify-end"><p>ลงชื่อ<Dot w="40mm" />ผู้อนุมัติ ( {a.name} ) วันที่<Dot w="24mm" /></p></div>
        </div>
        <div className={box}>
          <p><b>ใบรับเงิน</b></p>
          <p className="indent-[10mm]">ได้รับเงินยืม จำนวน <Dot w="26mm">{money(e.total)}</Dot> บาท (<Dot w="62mm">{bahtText(e.total)}</Dot>) ไปเป็นการถูกต้องแล้ว</p>
          <div className="mt-[2mm] flex justify-end"><p>ลงชื่อ<Dot w="40mm" />ผู้รับเงิน ( {e.employee} ) วันที่ <Dot w="24mm">{pay ? thDateLong(pay.at) : ""}</Dot></p></div>
        </div>
        <Footer refNo={`${e.id} · หน้า 1/2`} />
      </Paper>

      <Paper className="text-[11.5pt]">
        <h2 className="text-center text-[16pt] font-bold">รายการส่งใช้เงินยืม</h2>
        <p className="text-center text-[10.5pt]">สัญญาการยืมเงินเลขที่ {e.id} · ผู้ยืม {e.employee} · จำนวนเงินยืม {money(e.total)} บาท</p>
        <table className={`${tbl} mt-[4mm] text-[10pt]`}>
          <thead>
            <tr className="bg-black/5">
              <th className="w-[12mm]">ครั้งที่</th><th className="w-[26mm]">วัน เดือน ปี</th><th>รายการส่งใช้</th>
              <th className="w-[26mm]">จำนวนเงิน</th><th className="w-[26mm]">คงค้าง</th><th className="w-[28mm]">ลายมือชื่อผู้รับ</th><th className="w-[20mm]">ใบรับเลขที่</th>
            </tr>
          </thead>
          <tbody>
            {actual !== undefined && (
              <>
                <tr>
                  <td className="text-center">1</td><td className="text-center">{thDateLong(e.items[0]?.date ?? e.createdAt)}</td>
                  <td>ใบสำคัญคู่จ่าย {e.items.length} รายการ</td>
                  <td className="text-right tabular-nums">{money(actual)}</td><td className="text-right tabular-nums">{money(Math.max(0, e.total - actual))}</td><td /><td />
                </tr>
                {e.total > actual && (
                  <tr>
                    <td className="text-center">2</td><td />
                    <td>เงินสด (คืนเงินเหลือจ่าย)</td>
                    <td className="text-right tabular-nums">{money(e.total - actual)}</td><td className="text-right tabular-nums">0.00</td><td /><td />
                  </tr>
                )}
              </>
            )}
            {pad(actual === undefined ? 14 : 12, 7)}
          </tbody>
        </table>
        <div className="mt-[6mm] text-[10.5pt]">
          <p className="font-bold">หมายเหตุ</p>
          <ol className="list-inside list-decimal">
            <li>ผู้ยืมต้องส่งใช้เงินยืมภายใน 15 วันนับจากวันที่ได้รับเงิน หรือตามวันครบกำหนดที่ระบุในสัญญา</li>
            <li>การส่งใช้ด้วยใบสำคัญคู่จ่าย ให้แนบใบเสร็จรับเงินหรือใบสำคัญรับเงินตัวจริงทุกฉบับ</li>
            <li>เมื่อส่งใช้ครบถ้วนแล้ว ฝ่ายบัญชีจะคืนสัญญาฉบับนี้หรือออกใบรับให้ผู้ยืมเป็นหลักฐาน</li>
          </ol>
        </div>
        <Footer refNo={`${e.id} · หน้า 2/2`} />
      </Paper>
    </>
  );
}

/* ═════════════ 7. ใบส่งใช้เงินยืม (เคลียร์เงินยืม) ═════════════ */
export function ClearingDoc({ e }: { e: Expense }) {
  const u = who(e);
  const a = approverOf(e);
  const used = e.advanceActual ?? e.items.reduce((s, i) => s + i.amount, 0);
  const diff = e.total - used;
  return (
    <Paper>
      <Letterhead title="ใบส่งใช้เงินยืมทดรองจ่าย" subtitle="ADVANCE CLEARING"
        no={<><p>อ้างอิง <b>{e.id}</b></p><p>วันที่ <Dot w="30mm" /></p></>} />

      <div className="grid grid-cols-2 gap-x-[6mm] gap-y-[1mm] text-[11.5pt]">
        <Line label="ผู้ยืม">{e.employee}</Line>
        <Line label="ตำแหน่ง">{u?.position}</Line>
        <div className="col-span-2"><Line label="วัตถุประสงค์">{e.title}</Line></div>
        <Line label="วันที่รับเงินยืม">{e.payment ? thDateLong(e.payment.at) : ""}</Line>
        <Line label="ครบกำหนดส่งใช้">{e.advanceDueDate ? thDateLong(e.advanceDueDate) : ""}</Line>
      </div>

      <p className="mt-[4mm] text-[11.5pt] font-bold">รายการค่าใช้จ่ายที่ใช้จริง</p>
      <table className={`${tbl} mt-[1mm]`}>
        <thead>
          <tr className="bg-black/5"><th className="w-[10mm]">ที่</th><th className="w-[26mm]">วันที่</th><th>รายการ</th><th className="w-[18mm]">หลักฐาน</th><th className="w-[30mm]">จำนวนเงิน</th></tr>
        </thead>
        <tbody>
          {e.items.map((it, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td className="text-center">{new Date(it.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</td>
              <td>{it.description} <span className="text-[9pt] text-black/60">({it.category})</span></td>
              <td className="text-center">{it.receipts || "-"}</td>
              <td className="text-right tabular-nums">{money(it.amount)}</td>
            </tr>
          ))}
          {pad(7 - e.items.length, 5)}
          <tr className="font-bold"><td colSpan={4} className="text-right">รวมใช้จริง</td><td className="text-right tabular-nums">{money(used)}</td></tr>
        </tbody>
      </table>

      <div className="mt-[4mm] ml-auto w-[110mm] border-2 border-black text-[11.5pt]">
        {[
          ["เงินยืมที่ได้รับ", money(e.total)],
          ["หัก ค่าใช้จ่ายที่ใช้จริง", money(used)],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between border-b border-black px-[3mm] py-[1mm]"><span>{l}</span><span className="tabular-nums">{v}</span></div>
        ))}
        <div className="px-[3mm] py-[1.5mm] font-bold">
          <div className="flex justify-between">
            <span><Box checked={diff > 0}>คืนเงินเหลือจ่าย</Box></span>
            <span className="tabular-nums">{diff > 0 ? money(diff) : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span><Box checked={diff < 0}>เบิกเพิ่ม (ใช้เกิน)</Box></span>
            <span className="tabular-nums">{diff < 0 ? money(-diff) : "-"}</span>
          </div>
          <div className="flex justify-between"><span><Box checked={diff === 0}>พอดี</Box></span><span /></div>
        </div>
      </div>
      {diff !== 0 && <p className="mt-[1mm] text-right text-[10.5pt]">({bahtText(Math.abs(diff))})</p>}

      <SignRow className="mt-[5mm]" signers={[
        { t: "ผู้ส่งใช้เงินยืม", n: e.employee },
        { t: "ผู้ตรวจสอบ (บัญชี)", n: COMPANY.accountant.name },
        { t: "ผู้อนุมัติ", n: a.name },
        { t: diff >= 0 ? "ผู้รับคืนเงิน" : "ผู้รับเงินเบิกเพิ่ม", n: diff >= 0 ? COMPANY.accountant.name : e.employee },
      ]} />
      <Footer refNo={e.id} />
    </Paper>
  );
}
