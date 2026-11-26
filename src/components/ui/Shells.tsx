"use client";

import {
  Banknote, Bell, ClipboardCheck, FileSpreadsheet, FileText, FolderCog, History, Home, LayoutDashboard, LayoutGrid,
  PlusCircle, Plus, Settings, Users, Wallet,
} from "lucide-react";
import { AppShell, type ShellConfig } from "./AppShell";
import { EXPENSES, daysFromToday, isOpenAdvance } from "@/lib/mock";

/** ผู้ใช้ที่ Login อยู่ (ส่งมาจาก layout ฝั่งเซิร์ฟเวอร์) */
export interface ShellUser { name: string; department: string; role: "USER" | "ADMIN" }

const userConfig = (me: ShellUser): ShellConfig => ({
  accent: "เบิกจ่าย",
  tagline: "ระบบเบิกค่าใช้จ่าย",
  groups: [
    {
      title: "เมนูหลัก",
      links: [
        { name: "หน้าแรก", href: "/", icon: Home, exact: true },
        { name: "สร้างใบเบิก", href: "/new", icon: PlusCircle },
        { name: "ใบเบิกของฉัน", href: "/history", icon: History },
        { name: "เงินยืม", href: "/advances", icon: Wallet },
        { name: "การแจ้งเตือน", href: "/notifications", icon: Bell },
      ],
    },
  ],
  tabs: [
    { name: "หน้าแรก", href: "/", icon: Home },
    { name: "ใบเบิก", href: "/history", icon: FileText },
    { name: "เบิกเงิน", href: "/new", icon: Plus, center: true },
    { name: "เงินยืม", href: "/advances", icon: Wallet },
    { name: "แจ้งเตือน", href: "/notifications", icon: Bell, badge: 2 },
  ],
  extraTitles: [["/expenses/", "รายละเอียดใบเบิก"], ["/new", "สร้างใบเบิก"], ["/profile", "โปรไฟล์"]],
  user: { name: me.name, sub: me.department },
  // แอดมินที่เลือกมุมมองพนักงาน → มีเมนู "เปลี่ยนมุมมอง"
  canSwitchView: me.role === "ADMIN",
  profileHref: "/profile",
  avatarHref: "/profile",
  notificationsHref: "/notifications",
});

export function UserShell({ children, me }: { children: React.ReactNode; me: ShellUser }) {
  return <AppShell config={userConfig(me)}>{children}</AppShell>;
}

export function AdminShell({ children, me }: { children: React.ReactNode; me: ShellUser }) {
  const pending = EXPENSES.filter((e) => e.status === "pending").length;
  const toPay = EXPENSES.filter((e) => e.status === "approved" || e.status === "awaiting_payment").length;
  const advances = EXPENSES.filter(
    (e) => e.status === "clearing" || (isOpenAdvance(e) && daysFromToday(e.advanceDueDate!) < 0),
  ).length;

  const config: ShellConfig = {
    accent: "ADMIN",
    tagline: "จัดการการเบิกจ่าย",
    groups: [
      { title: "ภาพรวม", links: [{ name: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard, exact: true }] },
      {
        title: "งานที่ต้องทำ",
        links: [
          { name: "อนุมัติใบเบิก", href: "/admin/approvals", icon: ClipboardCheck, badge: pending },
          { name: "จ่ายเงิน", href: "/admin/payments", icon: Banknote, badge: toPay },
          { name: "เงินยืม", href: "/admin/advances", icon: Wallet, badge: advances },
        ],
      },
      {
        title: "จัดการข้อมูล",
        links: [
          { name: "ใบเบิกทั้งหมด", href: "/admin/expenses", icon: FileText },
          { name: "รายงานบัญชี", href: "/admin/reports", icon: FileSpreadsheet },
          { name: "พนักงาน", href: "/admin/employees", icon: Users },
          { name: "หมวดค่าใช้จ่าย", href: "/admin/categories", icon: FolderCog },
          { name: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings },
        ],
      },
    ],
    tabs: [
      { name: "หน้าแรก", href: "/admin", icon: LayoutDashboard },
      { name: "อนุมัติ", href: "/admin/approvals", icon: ClipboardCheck, badge: pending },
      { name: "จ่ายเงิน", href: "/admin/payments", icon: Banknote, badge: toPay },
      { name: "เงินยืม", href: "/admin/advances", icon: Wallet, badge: advances },
      { name: "เมนู", href: "/admin/menu", icon: LayoutGrid },
    ],
    extraTitles: [["/admin/menu", "เมนู"]],
    user: { name: me.name, sub: "แอดมิน" },
    canSwitchView: true,
    avatarHref: "/admin/menu",
    notificationsHref: "/admin/approvals",
  };
  return <AppShell config={config}>{children}</AppShell>;
}
