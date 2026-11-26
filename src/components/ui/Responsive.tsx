/** มุมมองเฉพาะมือถือ (< 768px) */
export function MobileView({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden">{children}</div>;
}

/** มุมมองเฉพาะคอม/แท็บเล็ต (≥ 768px) */
export function DesktopView({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}
