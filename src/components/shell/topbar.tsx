"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Moon, Sun, LogOut, Search, Bell, Menu, ChevronDown, ChevronRight,
  Settings, User, ShieldCheck, Command, MessageSquare, Grid3x3,
  Inbox, FlaskConical, FolderKanban, FileBarChart2, Beaker, TestTube2,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { notifications } from "@/lib/mock-extra";
import { usePendingCount } from "@/lib/auto-translate";

function humanize(seg: string) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const apps = [
  { name: "Tests",     href: "/tests",     icon: TestTube2,     tone: "from-teal-500 to-indigo-500" },
  { name: "Samples",   href: "/samples",   icon: Beaker,        tone: "from-cyan-500 to-blue-600" },
  { name: "Projects",  href: "/projects",  icon: FolderKanban,  tone: "from-amber-500 to-orange-500" },
  { name: "Reports",   href: "/reports",   icon: FileBarChart2, tone: "from-emerald-500 to-teal-600" },
  { name: "Equipment", href: "/equipment", icon: FlaskConical,  tone: "from-sky-500 to-cyan-600" },
  { name: "Audit",     href: "/audit",     icon: ShieldCheck,   tone: "from-indigo-500 to-blue-600" },
];

const messages = [
  { id: "m1", from: "Eng. Khalid Al-Otaibi", body: "PC-14 results approved — please release report.", ts: "5 min" },
  { id: "m2", from: "Sarah Mansour", body: "BH-08 tests ready for your review.", ts: "1 h" },
  { id: "m3", from: "Quality team", body: "Weekly compliance summary attached.", ts: "3 h" },
];

export function Topbar() {
  const { lang, theme, setLang, setTheme, user, signOut, toggleSidebar } = useApp();
  const tt = useT();
  const router = useRouter();
  const pathname = usePathname();
  const pending = usePendingCount();
  const [open, setOpen] = useState<"user" | "bell" | "msg" | "apps" | "settings" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const segments = pathname.split("/").filter(Boolean);
  const unread = notifications.filter((n) => !n.read).length;
  const pageTitle = tt(segments.length === 0 ? "Dashboard" : humanize(segments[segments.length - 1]));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = () => { signOut(); router.push("/login"); };

  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 h-[72px] border-b border-[rgb(var(--border))] bg-[rgb(var(--topbar))]/85 backdrop-blur-xl flex items-center px-4 sm:px-6 gap-3"
    >
      {/* Hamburger — sits where sidebar ends */}
      <button
        onClick={toggleSidebar}
        className="w-10 h-10 rounded-full border border-[rgb(var(--border))] grid place-items-center text-[rgb(var(--muted))] hover:text-brand-600 hover:border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all shrink-0"
        title={tt("Toggle sidebar")}
      >
        <Menu className="w-[18px] h-[18px]" />
      </button>

      {/* Page title */}
      <h1 className="text-2xl font-bold tracking-tight truncate hidden md:block">
        {pageTitle}
      </h1>

      {/* Search */}
      {/* <div className="flex-1 max-w-xl mx-auto relative hidden sm:block">
        <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] rtl:right-5 rtl:left-auto pointer-events-none" />
        <input
          placeholder={lang === "ar" ? "ابحث عن شيء..." : "Search something..."}
          className="w-full h-11 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] pl-12 rtl:pr-12 rtl:pl-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
        />
        <span className="hidden lg:inline-flex absolute right-4 rtl:left-4 rtl:right-auto top-1/2 -translate-y-1/2 items-center gap-0.5 text-[10px] font-mono text-[rgb(var(--muted))]">
          <Command className="w-2.5 h-2.5" />K
        </span>
      </div> */}

      {/* Right side icons */}
      <div className="flex items-center gap-1 ml-auto">
        {pending > 0 && (
          <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/10 rounded-full px-2.5 py-1 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            {tt("Translating")}… {pending}
          </span>
        )}
        {/* Language flag */}
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="icon-btn" title={tt("Toggle language")}>
          <span className="text-xs font-bold leading-none">{lang === "en" ? "AR" : "EN"}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setOpen(open === "bell" ? null : "bell")} className="icon-btn" title={tt("Notifications")}>
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">{unread}</span>
            )}
          </button>
          {open === "bell" && <BellPanel onClose={() => setOpen(null)} />}
        </div>

        {/* Messages */}
        <div className="relative">
          <button onClick={() => setOpen(open === "msg" ? null : "msg")} className="icon-btn" title={tt("Messages")}>
            <MessageSquare className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-cyan2-500 text-white text-[9px] font-bold grid place-items-center">3</span>
          </button>
          {open === "msg" && <MsgPanel onClose={() => setOpen(null)} />}
        </div>

        {/* Apps */}
        <div className="relative">
          <button onClick={() => setOpen(open === "apps" ? null : "apps")} className="icon-btn" title={tt("Apps")}>
            <Grid3x3 className="w-[18px] h-[18px]" />
          </button>
          {open === "apps" && <AppsPanel onClose={() => setOpen(null)} />}
        </div>

        {/* Settings */}
        <Link href="/settings" className="icon-btn" title={tt("Settings")}>
          <Settings className="w-[18px] h-[18px]" />
        </Link>

        {/* Theme */}
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="icon-btn" title={tt("Toggle theme")}>
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* User chip */}
        {user && (
          <div className="relative ml-2">
            <button
              onClick={() => setOpen(open === "user" ? null : "user")}
              className="flex items-center gap-2.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--hover))] pl-1 pr-3 rtl:pl-3 rtl:pr-1 py-1 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-brand-gradient text-white grid place-items-center font-bold text-sm shadow-sm">
                {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="hidden lg:block text-left rtl:text-right leading-tight">
                <div className="text-sm font-semibold">{user.name.split(" ").slice(0, 2).join(" ")}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[rgb(var(--muted))]" />
            </button>
            {open === "user" && <UserPanel onClose={() => setOpen(null)} onSignOut={handleSignOut} />}
          </div>
        )}
      </div>

      {/* Mobile breadcrumb row (below header on small screens) */}
      <div className="md:hidden absolute -bottom-7 left-4 text-xs text-[rgb(var(--muted))]">
        <Link href="/dashboard" className="hover:text-brand-600">CiviXLab</Link>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const last = i === segments.length - 1;
          return (
            <span key={href} className="inline-flex items-center gap-1 ml-1">
              <ChevronRight className="w-3 h-3 inline opacity-60" />
              {last ? <span className="text-[rgb(var(--fg))] font-medium">{humanize(seg)}</span>
                    : <Link href={href} className="hover:text-brand-600">{humanize(seg)}</Link>}
            </span>
          );
        })}
      </div>
    </header>
  );
}

function PanelShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-[340px] card p-2 animate-slide-up overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

function MsgPanel({ onClose }: { onClose: () => void }) {
  const tt = useT();
  return (
    <PanelShell>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgb(var(--border))] -mx-2 -mt-2 mb-1 bg-gradient-to-r from-cyan2-500/10 to-brand-500/10">
        <div>
          <div className="font-semibold text-sm">{tt("Messages")}</div>
          <div className="text-[10px] text-[rgb(var(--muted))]">3 {tt("unread")}</div>
        </div>
        <Inbox className="w-4 h-4 text-cyan2-500" />
      </div>
      <div className="space-y-0.5">
        {messages.map((m) => (
          <div key={m.id} className="px-3 py-2.5 rounded-lg hover:bg-[rgb(var(--hover))] cursor-pointer">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-semibold text-sm">{m.from}</div>
              <div className="text-[10px] text-[rgb(var(--muted))]">{m.ts}</div>
            </div>
            <div className="text-xs text-[rgb(var(--muted))] mt-0.5 line-clamp-2">{m.body}</div>
          </div>
        ))}
      </div>
      <Link href="#" onClick={onClose} className="block text-center text-xs text-brand-600 hover:underline py-2 border-t border-[rgb(var(--border))] mt-1 -mx-2 -mb-2 bg-[rgb(var(--hover))]/40">
        {tt("View all messages")}
      </Link>
    </PanelShell>
  );
}

function BellPanel({ onClose }: { onClose: () => void }) {
  const tt = useT();
  return (
    <PanelShell>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgb(var(--border))] -mx-2 -mt-2 mb-1 bg-gradient-to-r from-brand-500/10 to-rose-500/10">
        <div>
          <div className="font-semibold text-sm">{tt("Notifications")}</div>
          <div className="text-[10px] text-[rgb(var(--muted))]">{notifications.filter((n) => !n.read).length} {tt("unread")}</div>
        </div>
        <Bell className="w-4 h-4 text-rose-500" />
      </div>
      <div className="max-h-[360px] overflow-y-auto space-y-0.5">
        {notifications.slice(0, 5).map((n) => (
          <Link
            key={n.id}
            href={n.href ?? "/notifications"}
            onClick={onClose}
            className="block px-3 py-2.5 rounded-lg hover:bg-[rgb(var(--hover))]"
          >
            <div className="flex items-start gap-2.5">
              <span className={cn(
                "w-8 h-8 rounded-lg grid place-items-center shrink-0 text-white",
                n.level === "error" && "bg-rose-gradient",
                n.level === "warn" && "bg-sunset-gradient",
                n.level === "success" && "bg-emerald-gradient",
                n.level === "info" && "bg-ocean-gradient",
              )}>
                <Bell className="w-3.5 h-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">{n.title}</div>
                <div className="text-xs text-[rgb(var(--muted))] truncate mt-0.5">{n.body}</div>
                <div className="text-[10px] text-[rgb(var(--muted))] mt-1">{n.ts}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/notifications" onClick={onClose} className="block text-center text-xs text-brand-600 hover:underline py-2 border-t border-[rgb(var(--border))] mt-1 -mx-2 -mb-2 bg-[rgb(var(--hover))]/40">
        {tt("View all")}
      </Link>
    </PanelShell>
  );
}

function AppsPanel({ onClose }: { onClose: () => void }) {
  const tt = useT();
  return (
    <PanelShell className="w-[300px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgb(var(--border))] -mx-2 -mt-2 mb-2">
        <div className="font-semibold text-sm">{tt("Quick apps")}</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {apps.map((a) => (
          <Link
            key={a.name}
            href={a.href}
            onClick={onClose}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[rgb(var(--hover))] transition-colors"
          >
            <div className={cn("w-12 h-12 rounded-xl grid place-items-center text-white shadow-md bg-gradient-to-br", a.tone)}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-center">{tt(a.name)}</span>
          </Link>
        ))}
      </div>
    </PanelShell>
  );
}

function UserPanel({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => void }) {
  const { user } = useApp();
  const tt = useT();
  if (!user) return null;
  return (
    <PanelShell className="w-[280px]">
      <div className="px-4 py-4 border-b border-[rgb(var(--border))] -mx-2 -mt-2 mb-1 bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-brand-gradient grid place-items-center text-white text-base font-bold shadow-glow">
          {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="font-semibold text-sm mt-2">{user.name}</div>
        <div className="text-[11px] text-[rgb(var(--muted))]">{user.email}</div>
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 rounded-full px-2 py-0.5">
          <ShieldCheck className="w-2.5 h-2.5" /> {user.tenant}
        </div>
      </div>
      <div className="py-1">
        <Link href="/settings" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-[rgb(var(--hover))]">
          <User className="w-4 h-4" /> {tt("Profile")}
        </Link>
        <Link href="/security" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-[rgb(var(--hover))]">
          <ShieldCheck className="w-4 h-4" /> {tt("Security & MFA")}
        </Link>
        <Link href="/settings" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-[rgb(var(--hover))]">
          <Settings className="w-4 h-4" /> {tt("Settings")}
        </Link>
      </div>
      <div className="py-1 border-t border-[rgb(var(--border))]">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600"
        >
          <LogOut className="w-4 h-4" /> {tt("Sign out")}
        </button>
      </div>
    </PanelShell>
  );
}
