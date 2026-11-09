"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string; icon: string; external?: boolean };

export default function Sidebar({ items, title, sub, user }: { items: NavItem[]; title: string; sub: string; user: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/app" || href === "/admin" ? path === href : path.startsWith(href.split("?")[0]));

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-5 py-5 font-extrabold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
          </svg>
        </span>
        <span className="leading-tight">
          {title}
          <span className="block text-xs font-semibold text-ink-3">{sub}</span>
        </span>
      </Link>
      <ul className="flex-1 space-y-0.5 px-3">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              target={it.external ? "_blank" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive(it.href) ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-canvas"
              }`}
            >
              <span className="w-5 text-center">{it.icon}</span>
              {it.label}
              {it.external && <span className="ml-auto text-xs text-ink-3">↗</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 border-t border-line px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{user.slice(0, 1)}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user}</span>
        <a href="/logout" className="text-xs text-ink-3 hover:text-danger">
          로그아웃
        </a>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-white lg:block">{nav}</aside>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <span className="font-extrabold">{title}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)} aria-label="메뉴 열기">
          ☰ 메뉴
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
