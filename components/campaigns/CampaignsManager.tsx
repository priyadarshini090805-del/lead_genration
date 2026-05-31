"use client";
import { useState, useEffect } from "react";
import { Plus, Megaphone, Play, Pause, Trash2, X, Sparkles, Users, Edit2 } from "lucide-react";

export function CampaignsManager() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCampaign, setEditCampaign] = useState<any>(null);

  async function load() {
    setLoading(true);
    const [c, l] = await Promise.all([
      fetch("/api/campaigns").then(r => r.json()),
      fetch("/api/leads?limit=200").then(r => r.json()),
    ]);
    setCampaigns(c.campaigns || []);
    setLeads(l.leads || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(id: string, current: string) {
    const status = current === "ACTIVE" ? "PAUSED" : "ACTIVE";
    await fetch(`/api/campaigns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    load();
  }

  const statusColor: Record<string, string> = {
    DRAFT: "bg-neutral-800 text-neutral-400",
    ACTIVE: "bg-white/10 text-green-400",
    PAUSED: "bg-neutral-800 text-yellow-400",
    COMPLETED: "bg-neutral-800 text-neutral-500",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Campaigns</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => { setEditCampaign(null); setShowCreate(true); }} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-40 shimmer" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="w-10 h-10 text-neutral-700 mb-3" />
          <p className="text-white text-sm font-medium">No campaigns yet</p>
          <p className="text-neutral-600 text-xs mt-1">Create outreach or follow-up campaigns to automate your pipeline</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">Create First Campaign</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="card space-y-3 hover:border-neutral-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${statusColor[c.status] || "badge-new"}`}>{c.status}</span>
                    <span className="badge bg-neutral-800 text-neutral-400">{c.type?.replace("_"," ")}</span>
                  </div>
                  <h3 className="text-white font-medium text-sm">{c.name}</h3>
                  {c.description && <p className="text-neutral-500 text-xs mt-0.5 line-clamp-2">{c.description}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditCampaign(c); setShowCreate(true); }} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteCampaign(c.id)} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className={`badge ${c.platform === "linkedin" ? "bg-neutral-800 text-blue-400" : "badge-new"}`}>{c.platform}</span>
                {c.scheduledAt && <span className="flex items-center gap-1">⏰ {new Date(c.scheduledAt).toLocaleDateString()}</span>}
              </div>

              {c.messageTemplate && (
                <div className="bg-neutral-800 rounded-lg px-3 py-2">
                  <p className="text-neutral-400 text-xs line-clamp-2">{c.messageTemplate}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                {c.status !== "COMPLETED" && (
                  <button onClick={() => toggleStatus(c.id, c.status)}
                    className={`btn-ghost !py-1.5 !px-3 text-xs flex items-center gap-1.5 ${c.status === "ACTIVE" ? "!text-yellow-400 !border-yellow-400/20" : "!text-green-400 !border-green-400/20"}`}>
                    {c.status === "ACTIVE" ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CampaignModal campaign={editCampaign} leads={leads} onClose={() => { setShowCreate(false); setEditCampaign(null); }} onSave={load} />
      )}
    </div>
  );
}

function CampaignModal({ campaign, leads, onClose, onSave }: { campaign: any; leads: any[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: campaign?.name || "",
    description: campaign?.description || "",
    type: campaign?.type || "OUTREACH",
    platform: campaign?.platform || "linkedin",
    messageTemplate: campaign?.messageTemplate || "",
    scheduledAt: campaign?.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0,16) : "",
  });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function genTemplate() {
    setGenerating(true);
    const res = await fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-message", leadName: "{{name}}", platform: form.platform, type: form.type === "OUTREACH" ? "CONNECTION" : "FOLLOW_UP", notes: form.description }),
    });
    if (res.ok) { const d = await res.json(); setForm(f => ({ ...f, messageTemplate: d.content })); }
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    const method = campaign ? "PUT" : "POST";
    const url = campaign ? `/api/campaigns/${campaign.id}` : "/api/campaigns";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    onSave(); onClose(); setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white">{campaign ? "Edit Campaign" : "New Campaign"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs text-neutral-500 mb-1">Campaign Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Q3 LinkedIn Outreach" /></div>
          <div><label className="block text-xs text-neutral-500 mb-1">Description</label>
            <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-neutral-500 mb-1">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="OUTREACH">Outreach</option>
                <option value="FOLLOW_UP">Follow-Up</option>
                <option value="GROUP_MESSAGE">Group Message</option>
              </select></div>
            <div><label className="block text-xs text-neutral-500 mb-1">Platform</label>
              <select className="input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                <option value="linkedin">LinkedIn</option>
                <option value="google">Google</option>
                <option value="all">All</option>
              </select></div>
          </div>
          <div><label className="block text-xs text-neutral-500 mb-1">Scheduled At (optional)</label>
            <input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-neutral-500">Message Template</label>
              <button onClick={genTemplate} disabled={generating} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {generating ? "Generating..." : "AI Generate"}
              </button>
            </div>
            <textarea className="input !h-32 resize-none" value={form.messageTemplate} onChange={e => setForm({...form, messageTemplate: e.target.value})} placeholder="Use {{name}}, {{company}} as placeholders..." />
            <p className="text-neutral-600 text-xs mt-1">Use {"{{name}}"}, {"{{company}}"}, {"{{title}}"} as personalization tokens</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={saving || !form.name} className="btn-primary">{saving ? "Saving..." : campaign ? "Update" : "Create Campaign"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
