"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, MessageSquare, Megaphone, FileText, Link2, Send, LogOut, ChevronLeft, ChevronRight, Zap, Calendar } from "lucide-react";
import { NotificationCenter } from "./notifications/NotificationCenter";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/leads", icon: Users, label: "Leads" },
  { href: "/dashboard/inbox", icon: MessageSquare, label: "Smart Inbox" },
  { href: "/dashboard/outreach", icon: Send, label: "Outreach" },
  { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/dashboard/scheduler", icon: Calendar, label: "Scheduler" },
  { href: "/dashboard/content", icon: FileText, label: "Content" },
  { href: "/dashboard/integrations", icon: Link2, label: "Integrations" },
];

export function DashboardNav({ user }: { user: any }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`flex flex-col h-screen border-r border-neutral-800 bg-neutral-950 transition-all duration-200 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}>
      {/* Logo + notification bell */}
      <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-neutral-800 ${collapsed ? "justify-center" : "justify-between"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-black" />
          </div>
          {!collapsed && <span className="font-semibold text-white text-sm tracking-tight">Hanexis</span>}
        </div>
        {!collapsed && <NotificationCenter />}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all ${active ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900"} ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? label : undefined}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-neutral-800 space-y-0.5">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || "User"}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-sm text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-all ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-sm text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900 transition-all ${collapsed ? "justify-center" : ""}`}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
