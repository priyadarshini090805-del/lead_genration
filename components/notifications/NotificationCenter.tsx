"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, Megaphone, MessageSquare, AlertCircle, FileText, Link2, UserPlus } from "lucide-react";

type Notification = {
  id: string; title: string; message: string; type: string; read: boolean; createdAt: string;
};

const typeIcon: Record<string, React.ReactNode> = {
  LEAD_ASSIGNED: <UserPlus className="w-3.5 h-3.5" />,
  FOLLOW_UP_DUE: <Bell className="w-3.5 h-3.5" />,
  MESSAGE_SENT: <MessageSquare className="w-3.5 h-3.5" />,
  MESSAGE_FAILED: <AlertCircle className="w-3.5 h-3.5" />,
  CONTENT_PUBLISHED: <FileText className="w-3.5 h-3.5" />,
  CONTENT_FAILED: <AlertCircle className="w-3.5 h-3.5" />,
  INTEGRATION_EXPIRED: <Link2 className="w-3.5 h-3.5" />,
};

const typeColor: Record<string, string> = {
  MESSAGE_FAILED: "text-red-400",
  CONTENT_FAILED: "text-red-400",
  INTEGRATION_EXPIRED: "text-yellow-400",
  MESSAGE_SENT: "text-green-400",
  CONTENT_PUBLISHED: "text-green-400",
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const d = await res.json();
      setNotifications(d.notifications);
      setUnreadCount(d.unreadCount);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  async function deleteNotif(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    const notif = notifications.find(n => n.id === id);
    setNotifications(n => n.filter(x => x.id !== id));
    if (notif && !notif.read) setUnreadCount(c => Math.max(0, c - 1));
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read" className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all">
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && !notifications.length ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 shimmer rounded-lg" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-neutral-600 text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-all cursor-pointer group ${!n.read ? "bg-neutral-800/20" : ""}`}>
                  <div className={`mt-0.5 flex-shrink-0 ${typeColor[n.type] || "text-neutral-500"}`}>
                    {typeIcon[n.type] || <Bell className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${n.read ? "text-neutral-400" : "text-white"}`}>{n.title}</p>
                    <p className="text-neutral-600 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-neutral-700 text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
                    <button onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                      className="p-1 rounded hover:bg-neutral-700 text-neutral-600 hover:text-red-400 transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-800">
              <button onClick={markAllRead} className="text-xs text-neutral-500 hover:text-white transition-all w-full text-center">
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
