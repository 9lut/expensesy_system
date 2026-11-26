"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronLeft, ChevronsUpDown, LogOut, PanelLeft, PanelLeftClose, Repeat, UserRound, type LucideIcon } from "lucide-react";
import { BrandLogo, BrandMark } from "./Brand";

export type NavLink = { name: string; href: string; icon: LucideIcon; badge?: number; exact?: boolean };
export type NavGroup = { title: string; links: NavLink[] };

export interface ShellConfig {
  accent: string;
  tagline: string;
  /** เมนูคอม (Sidebar) */
  groups: NavGroup[];
  /** แท็บล่างมือถือ — `center` = ปุ่มกลมใหญ่ตรงกลาง */
  tabs: (NavLink & { center?: boolean })[];
  /** ชื่อหน้าบนมือถือสำหรับหน้าที่ไม่อยู่ในเมนู */
  extraTitles: [prefix: string, title: string][];
  user: { name: string; sub: string };
  /** แอดมินเท่านั้น: แสดงเมนู "เปลี่ยนมุมมอง" (กลับไปหน้าเลือกมุมมองที่เห็นตอน Login) */
  canSwitchView: boolean;
  /** ลิงก์ "โปรไฟล์" ในเมนูผู้ใช้ (ไม่ใส่ = ไม่แสดง) */
  profileHref?: string;
  /** มือถือ: กดรูปผู้ใช้มุมขวาบนแล้วไปหน้านี้ */
  avatarHref: string;
  /** ปุ่มกระดิ่ง */
  notificationsHref: string;
}

const match = (path: string, l: { href: string; exact?: boolean }) =>
  l.exact ? path === l.href : path === l.href || path.startsWith(`${l.href}/`);

/**
 * โครงหน้า 2 แบบในตัวเดียว (เนื้อหา children render ครั้งเดียว)
 * - คอม  (md+): Sidebar ย่อ/ขยายได้ + Header
 * - มือถือ: แถบบน (ชื่อหน้า/ย้อนกลับ) + แท็บล่าง — หน้าย่อยซ่อนแท็บล่างเหมือนแอป
 */
export function AppShell({ config, children }: { config: ShellConfig; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const allLinks = config.groups.flatMap((g) => g.links);
  const current = allLinks.filter((l) => match(path, l)).sort((a, b) => b.href.length - a.href.length)[0];
  const extra = config.extraTitles.find(([p]) => path.startsWith(p));
  const isTabRoot = config.tabs.some((t) => !t.center && t.href === path);
  const title = (isTabRoot ? undefined : extra?.[1]) ?? current?.name ?? "";
  const hide = collapsed ? "md:hidden" : "";

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 md:flex md:h-dvh md:overflow-hidden">
      {/* ───────── คอม: Sidebar ───────── */}
      <aside className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 md:flex ${collapsed ? "w-[80px]" : "w-[272px]"}`}>
        <div className={`flex h-[72px] items-center gap-3 border-b border-slate-100 ${collapsed ? "justify-center" : "px-5"}`}>
          {config.accent === "ADMIN" || collapsed ? (
            <>
              <BrandMark />
              <div className={`leading-none ${hide}`}>
                <p className="whitespace-nowrap text-[16px] font-bold tracking-tight">EXPENSE <span className="text-blue-600">{config.accent}</span></p>
                <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-slate-400">{config.tagline}</p>
              </div>
            </>
          ) : (
            <BrandLogo height={40} />
          )}
        </div>
        <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {config.groups.map((g) => (
            <div key={g.title} className="space-y-1">
              {collapsed ? <div className="mx-auto mb-2 h-px w-10 bg-slate-200" /> : (
                <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{g.title}</h3>
              )}
              {g.links.map((l) => {
                const active = current?.href === l.href;
                const Icon = l.icon;
                return (
                  <Link key={l.href} href={l.href} title={collapsed ? l.name : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl py-2.5 transition-all ${collapsed ? "mx-auto size-11 justify-center" : "px-3"} ${
                      active ? "bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20" : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                    <Icon size={19} className={active ? "" : "text-slate-400 group-hover:text-blue-500"} />
                    <span className={`whitespace-nowrap text-[14px] ${hide}`}>{l.name}</span>
                    {!!l.badge && (
                      <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white text-blue-600" : "bg-rose-500 text-white"} ${collapsed ? "absolute -right-1 -top-1 border-2 border-white" : "ml-auto"}`}>
                        {l.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {/* ผู้ใช้ + เมนู (เปลี่ยนมุมมอง / ออกจากระบบ) */}
        <div className="relative border-t border-slate-100 p-2">
          {menuOpen && (
            <>
              <button aria-label="ปิดเมนู" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} />
              <div className={`absolute z-50 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl ${collapsed ? "bottom-2 left-[calc(100%+8px)] w-60" : "bottom-[calc(100%+4px)] left-2 right-2"}`}>
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold">{config.user.name}</p>
                  <p className="text-xs text-slate-500">{config.user.sub}</p>
                </div>
                {config.profileHref && (
                  <Link href={config.profileHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <UserRound size={16} className="text-slate-400" /> โปรไฟล์และความปลอดภัย
                  </Link>
                )}
                {config.canSwitchView && (
                  <Link href="/select-view" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Repeat size={16} className="text-slate-400" /> เปลี่ยนมุมมอง
                  </Link>
                )}
                <form action="/api/auth/logout" method="post">
                  <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </form>
              </div>
            </>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="เมนูผู้ใช้"
            className={`flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50 ${collapsed ? "justify-center" : ""}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white"><UserRound size={18} /></span>
            <span className={`min-w-0 flex-1 ${hide}`}>
              <span className="block truncate text-sm font-bold">{config.user.name}</span>
              <span className="block truncate text-xs text-slate-500">{config.user.sub}</span>
            </span>
            <ChevronsUpDown size={16} className={`text-slate-400 ${hide}`} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        {/* ───────── คอม: Header ───────── */}
        <header className="hidden h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-xl md:flex">
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(!collapsed)} aria-label="ย่อ/ขยายเมนู" className="-ml-2 rounded-xl p-2 text-slate-500 hover:bg-slate-100">
              {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <span className="text-[15px] font-bold">{title}</span>
          </div>
          <Link href={config.notificationsHref} aria-label="การแจ้งเตือน" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <Bell size={20} /><span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" />
          </Link>
        </header>

        {/* ───────── มือถือ: แถบบน ───────── */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200/70 bg-white/90 px-2 backdrop-blur-xl md:hidden">
          {isTabRoot ? (
            <div className="flex items-center gap-2 pl-2"><BrandMark size={30} /><span className="font-bold">{title || "หน้าแรก"}</span></div>
          ) : (
            <>
              <button onClick={() => router.back()} aria-label="ย้อนกลับ" className="rounded-full p-2 text-slate-600 active:bg-slate-100"><ChevronLeft size={24} /></button>
              <span className="truncate font-bold">{title}</span>
            </>
          )}
          {/* มุมขวาบน: กดรูปผู้ใช้ → โปรไฟล์ / เมนู */}
          <Link href={config.avatarHref} aria-label="โปรไฟล์" className="ml-auto flex items-center gap-2 rounded-full p-1 pr-1 active:bg-slate-100">
            <span className="hidden text-right text-xs leading-tight min-[380px]:block">
              <span className="block font-bold text-slate-800">{config.user.name.split(" ")[0]}</span>
              <span className="block text-slate-400">{config.user.sub}</span>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-slate-800 text-white"><UserRound size={17} /></span>
          </Link>
        </header>

        <main className="flex-1 md:overflow-y-auto">
          <div className={`w-full max-w-full px-4 pt-4 md:p-6 ${isTabRoot ? "pb-28" : "pb-32"} md:pb-8`}>{children}</div>
        </main>
      </div>

      {/* ───────── มือถือ: แท็บล่าง (เฉพาะหน้าหลักของแต่ละแท็บ) ───────── */}
      {isTabRoot && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${config.tabs.length}, minmax(0,1fr))` }}>
            {config.tabs.map((t) => {
              const Icon = t.icon;
              const active = !t.center && t.href === path;
              if (t.center) {
                return (
                  <li key={t.href} className="flex justify-center">
                    <Link href={t.href} aria-label={t.name} className="-mt-6 flex flex-col items-center gap-1 text-[11px] font-bold text-blue-600">
                      <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-white active:scale-95">
                        <Icon size={26} />
                      </span>
                      {t.name}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={t.href}>
                  <Link href={t.href} className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${active ? "text-blue-600" : "text-slate-400"}`}>
                    <Icon size={22} strokeWidth={active ? 2.6 : 2} />
                    {t.name}
                    {!!t.badge && <span className="absolute left-1/2 top-1.5 ml-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] text-white">{t.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
