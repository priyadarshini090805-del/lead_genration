"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Download, Upload, Trash2, Edit2, ExternalLink, RefreshCw, Sparkles, ChevronDown, X, Linkedin, Globe } from "lucide-react";

type Lead = {
  id: string; name: string; email?: string; company?: string; title?: string;
  platform: string; status: string; tags?: string; notes?: string; profileUrl?: string;
  avatarUrl?: string; industry?: string; location?: string; createdAt: string; unreadCount: number;
};

const STATUSES = ["NEW", "CONTACTED", "REPLIED", "CONVERTED", "LOST"];
const PLATFORMS = ["linkedin", "google", "manual"];

export function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPlatform) params.set("platform", filterPlatform);
    const res = await fetch(`/api/leads?${params}`);
    if (res.ok) { const d = await res.json(); setLeads(d.leads); setTotal(d.total); }
    setLoading(false);
  }, [page, search, filterStatus, filterPlatform]);

  useEffect(() => { load(); }, [load]);

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    load();
  }

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.size} leads?`)) return;
    await Promise.all(
     Array.from(selected).map(id =>
      fetch(`/api/leads/${id}`, { method: "DELETE" })
     )
   );
    setSelected(new Set());
    load();
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const statusColors: Record<string, string> = {
    NEW: "bg-neutral-800 text-neutral-300",
    CONTACTED: "bg-neutral-700 text-white",
    REPLIED: "bg-white/10 text-cyan-300",
    CONVERTED: "bg-white/20 text-white",
    LOST: "bg-neutral-900 text-neutral-600",
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Leads</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} className="btn-ghost !text-red-400 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selected.size})
            </button>
          )}
          <button onClick={() => setShowImport(true)} className="btn-ghost flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Import LinkedIn
          </button>
          <a href="/api/analytics/export" className="btn-ghost flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </a>
          <button onClick={() => { setEditLead(null); setShowAdd(true); }} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
          <input className="input !pl-9" placeholder="Search leads..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input !w-auto" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input !w-auto" value={filterPlatform} onChange={e => { setFilterPlatform(e.target.value); setPage(1); }}>
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={load} className="btn-ghost !p-2"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="py-3 px-4 text-left"><input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? new Set(leads.map(l => l.id)) : new Set())} /></th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Lead</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Platform</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Tags</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Added</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-5 shimmer rounded" /></td></tr>
                ))
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-neutral-600">
                  No leads yet. <button onClick={() => setShowAdd(true)} className="text-white underline">Add your first lead</button>
                </td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className={`hover:bg-neutral-800/30 transition-colors ${selected.has(lead.id) ? "bg-neutral-800/20" : ""}`}>
                  <td className="py-3 px-4"><input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="rounded" /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-white font-medium truncate">{lead.name}</p>
                          {lead.profileUrl && <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-neutral-600 hover:text-white" /></a>}
                        </div>
                        <p className="text-neutral-500 text-xs truncate">{lead.company || lead.email || lead.title || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${lead.platform === "linkedin" ? "bg-neutral-800 text-blue-400" : lead.platform === "google" ? "bg-neutral-800 text-red-400" : "bg-neutral-800 text-neutral-400"}`}>
                      {lead.platform}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select value={lead.status} onChange={async e => {
                      await fetch(`/api/leads/${lead.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) });
                      load();
                    }} className={`badge border-0 cursor-pointer bg-transparent ${statusColors[lead.status]} text-xs`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {lead.tags && <div className="flex flex-wrap gap-1">
                      {lead.tags.split(",").slice(0, 2).map(t => <span key={t} className="badge badge-new">{t.trim()}</span>)}
                    </div>}
                  </td>
                  <td className="py-3 px-4 text-neutral-600 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditLead(lead); setShowAdd(true); }} className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-500 hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteLead(lead.id)} className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-600">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost !py-1 !px-2 text-xs disabled:opacity-30">Prev</button>
              <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="btn-ghost !py-1 !px-2 text-xs disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddLeadModal lead={editLead} onClose={() => { setShowAdd(false); setEditLead(null); }} onSave={load} />}
      {showImport && <ImportLinkedInModal onClose={() => setShowImport(false)} onSave={load} />}
    </div>
  );
}

function AddLeadModal({ lead, onClose, onSave }: { lead: Lead | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: lead?.name || "", email: lead?.email || "", company: lead?.company || "", title: lead?.title || "", platform: lead?.platform || "manual", status: lead?.status || "NEW", notes: lead?.notes || "", tags: lead?.tags || "", phone: "", profileUrl: lead?.profileUrl || "", industry: lead?.industry || "", location: lead?.location || "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setLoading(true); setErr("");
    const method = lead ? "PUT" : "POST";
    const url = lead ? `/api/leads/${lead.id}` : "/api/leads";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { onSave(); onClose(); } else { const d = await res.json(); setErr(d.error); }
    setLoading(false);
  }

  return (
    <Modal title={lead ? "Edit Lead" : "Add Lead"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="block text-xs text-neutral-500 mb-1">Name *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name" /></div>
        <div><label className="block text-xs text-neutral-500 mb-1">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" /></div>
        <div><label className="block text-xs text-neutral-500 mb-1">Phone</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 234..." /></div>
        <div><label className="block text-xs text-neutral-500 mb-1">Company</label><input className="input" value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company" /></div>
        <div><label className="block text-xs text-neutral-500 mb-1">Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Job title" /></div>
        <div><label className="block text-xs text-neutral-500 mb-1">Platform *</label>
          <select className="input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-neutral-500 mb-1">Status</label>
          <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="block text-xs text-neutral-500 mb-1">Industry</label><input className="input" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="SaaS, Finance..." /></div>
        <div><label className="block text-xs text-neutral-500 mb-1">Location</label><input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="City, Country" /></div>
        <div className="col-span-2"><label className="block text-xs text-neutral-500 mb-1">Profile URL</label><input className="input" value={form.profileUrl} onChange={e => setForm({...form, profileUrl: e.target.value})} placeholder="https://linkedin.com/in/..." /></div>
        <div className="col-span-2"><label className="block text-xs text-neutral-500 mb-1">Tags (comma separated)</label><input className="input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="hot-lead, saas, decision-maker" /></div>
        <div className="col-span-2"><label className="block text-xs text-neutral-500 mb-1">Notes</label><textarea className="input !h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Additional context..." /></div>
      </div>
      {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={loading || !form.name} className="btn-primary">{loading ? "Saving..." : lead ? "Update Lead" : "Add Lead"}</button>
      </div>
    </Modal>
  );
}

function ImportLinkedInModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true); setErr(""); setResult(null);
    const res = await fetch("/api/leads/import-linkedin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ searchQuery: query }) });
    const d = await res.json();
    if (!res.ok) setErr(d.error);
    else { setResult(d); onSave(); }
    setLoading(false);
  }

  return (
    <Modal title="Import from LinkedIn" onClose={onClose}>
      <p className="text-neutral-500 text-sm mb-4">Search for LinkedIn profiles to import as leads. Requires LinkedIn to be connected in Integrations.</p>
      <div className="space-y-3">
        <div><label className="block text-xs text-neutral-500 mb-1">Search Query</label>
          <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder='e.g. "CEO SaaS startup" or "Marketing Director"' />
        </div>
      </div>
      {err && <p className="text-red-400 text-xs mt-2 bg-red-500/10 p-2 rounded-lg">{err}</p>}
      {result && <p className="text-green-400 text-xs mt-2 bg-white/5 p-2 rounded-lg">{result.message}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="btn-ghost">Close</button>
        <button onClick={run} disabled={loading || !query} className="btn-primary flex items-center gap-1.5">
          {loading ? <><div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> Importing...</> : <><Linkedin className="w-3.5 h-3.5" /> Search & Import</>}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
