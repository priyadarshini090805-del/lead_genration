"use client";
import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, Trash2, Edit2, RefreshCw, X, CheckCircle, AlertCircle, XCircle } from "lucide-react";

const TIMEZONES = ["UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];

const statusIcon: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3.5 h-3.5 text-neutral-500" />,
  SCHEDULED: <Calendar className="w-3.5 h-3.5 text-blue-400" />,
  SENT: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  FAILED: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  CANCELLED: <XCircle className="w-3.5 h-3.5 text-neutral-600" />,
};

export function SchedulerPanel() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  async function load() {
    setLoading(true);
    const [t, l, c] = await Promise.all([
      fetch(`/api/scheduler${filterStatus ? `?status=${filterStatus}` : ""}`).then(r => r.json()),
      fetch("/api/leads?limit=200").then(r => r.json()),
      fetch("/api/content").then(r => r.json()),
    ]);
    setTasks(t.tasks || []);
    setLeads(l.leads || []);
    setContents(c.contents || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function cancel(id: string) {
    if (!confirm("Cancel this scheduled task?")) return;
    await fetch(`/api/scheduler/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Scheduler</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Schedule follow-ups and content publishing with timezone support</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost !p-2"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Schedule Task
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit">
        {["", "SCHEDULED", "SENT", "FAILED", "CANCELLED"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterStatus === s ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Tasks table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase tracking-wide">Type</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase tracking-wide">Lead / Content</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase tracking-wide">Scheduled For</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase tracking-wide">Timezone</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="py-3 px-4 text-right text-xs text-neutral-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {loading ? (
              [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 shimmer rounded" /></td></tr>)
            ) : tasks.length === 0 ? (
              <tr><td colSpan={6} className="py-14 text-center text-neutral-600 text-sm">
                No tasks scheduled. <button onClick={() => setShowCreate(true)} className="text-white underline">Create one</button>
              </td></tr>
            ) : tasks.map(task => {
              const payload = JSON.parse(task.payload || "{}");
              return (
                <tr key={task.id} className="hover:bg-neutral-800/20 transition-colors">
                  <td className="py-3 px-4"><span className="badge badge-new">{task.type.replace("_", " ")}</span></td>
                  <td className="py-3 px-4 text-white text-xs">{task.lead?.name || payload.contentId ? "Content" : "—"}</td>
                  <td className="py-3 px-4 text-neutral-300 text-xs">{new Date(task.scheduledFor).toLocaleString()}</td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">{task.timezone}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[task.status]}
                      <span className={`text-xs ${task.status === "SENT" ? "text-green-400" : task.status === "FAILED" ? "text-red-400" : task.status === "CANCELLED" ? "text-neutral-600" : "text-neutral-300"}`}>
                        {task.status}
                      </span>
                    </div>
                    {task.lastError && <p className="text-red-400 text-xs mt-0.5 truncate max-w-xs" title={task.lastError}>{task.lastError}</p>}
                  </td>
                  <td className="py-3 px-4">
                    {(task.status === "SCHEDULED" || task.status === "PENDING") && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => cancel(task.id)} className="p-1.5 rounded hover:bg-neutral-700 text-neutral-500 hover:text-red-400 transition-all" title="Cancel">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateTaskModal leads={leads} contents={contents} onClose={() => setShowCreate(false)} onSave={load} />}
    </div>
  );
}

function CreateTaskModal({ leads, contents, onClose, onSave }: { leads: any[]; contents: any[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ type: "FOLLOW_UP", leadId: "", contentId: "", scheduledFor: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", autoGenerate: true, message: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setSaving(true); setErr("");
    const res = await fetch("/api/scheduler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (res.ok) { onSave(); onClose(); } else setErr(d.error);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white">Schedule New Task</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs text-neutral-500 mb-1">Task Type</label>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="FOLLOW_UP">Follow-Up Message</option>
              <option value="CONTENT_PUBLISH">Publish Content</option>
              <option value="CAMPAIGN_SEND">Campaign Send</option>
            </select>
          </div>
          {form.type === "FOLLOW_UP" && (
            <div><label className="block text-xs text-neutral-500 mb-1">Lead *</label>
              <select className="input" value={form.leadId} onChange={e => setForm({...form, leadId: e.target.value})}>
                <option value="">Select lead...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.company || l.platform}</option>)}
              </select>
            </div>
          )}
          {form.type === "CONTENT_PUBLISH" && (
            <div><label className="block text-xs text-neutral-500 mb-1">Content *</label>
              <select className="input" value={form.contentId} onChange={e => setForm({...form, contentId: e.target.value})}>
                <option value="">Select content...</option>
                {contents.map(c => <option key={c.id} value={c.id}>{c.title} ({c.type})</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-neutral-500 mb-1">Date & Time *</label>
              <input type="datetime-local" className="input" value={form.scheduledFor} onChange={e => setForm({...form, scheduledFor: e.target.value})} />
            </div>
            <div><label className="block text-xs text-neutral-500 mb-1">Timezone</label>
              <select className="input" value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
          {form.type === "FOLLOW_UP" && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoGenerate} onChange={e => setForm({...form, autoGenerate: e.target.checked})} className="rounded" />
                <span className="text-sm text-neutral-300">Auto-generate AI message</span>
              </label>
              {!form.autoGenerate && (
                <div><label className="block text-xs text-neutral-500 mb-1">Custom Message</label>
                  <textarea className="input !h-24 resize-none" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Your follow-up message..." />
                </div>
              )}
            </>
          )}
          {err && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={saving || !form.scheduledFor || (form.type === "FOLLOW_UP" && !form.leadId) || (form.type === "CONTENT_PUBLISH" && !form.contentId)} className="btn-primary">
              {saving ? "Scheduling..." : "Schedule Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
