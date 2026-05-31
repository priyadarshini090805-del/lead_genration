"use client";
import { useState, useEffect } from "react";
import { Plus, Sparkles, FileText, Trash2, Edit2, X, Calendar, Clock } from "lucide-react";

const CONTENT_TYPES = ["POST", "POSTER", "VIDEO_SCRIPT", "JOB_POST"] as const;
type ContentType = typeof CONTENT_TYPES[number];

export function ContentCreator() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filterType, setFilterType] = useState<ContentType | "">("");

  async function load() {
    setLoading(true);
    const params = filterType ? `?type=${filterType}` : "";
    const res = await fetch(`/api/content${params}`);
    if (res.ok) { const d = await res.json(); setContents(d.contents); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterType]);

  async function deleteContent(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/content/${id}`, { method: "DELETE" });
    load();
  }

  const typeIcons: Record<string, string> = { POST: "", POSTER: "", VIDEO_SCRIPT: "", JOB_POST: "" };
  const statusColor: Record<string, string> = {
    DRAFT: "badge-new", SCHEDULED: "bg-neutral-800 text-yellow-400", PUBLISHED: "bg-white/10 text-green-400"
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Content</h1>
          <p className="text-neutral-500 text-sm mt-0.5">AI-generated posts, scripts & job listings</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowCreate(true); }} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create Content
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit flex-wrap">
        <button onClick={() => setFilterType("")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!filterType ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}>All</button>
        {CONTENT_TYPES.map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === t ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}>
            {typeIcons[t]} {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-48 shimmer" />)}
        </div>
      ) : contents.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <FileText className="w-10 h-10 text-neutral-700 mb-3" />
          <p className="text-white text-sm font-medium">No content yet</p>
          <p className="text-neutral-600 text-xs mt-1">Generate AI-powered posts, video scripts, and job listings</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">Create First Piece</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map(item => (
            <div key={item.id} className="card space-y-3 hover:border-neutral-700 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeIcons[item.type]}</span>
                  <div>
                    <p className="text-white text-sm font-medium truncate max-w-[180px]">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`badge ${statusColor[item.status] || "badge-new"}`}>{item.status}</span>
                      {item.platform && <span className="badge badge-new">{item.platform}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setEditItem(item); setShowCreate(true); }} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteContent(item.id)} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="bg-neutral-800 rounded-lg px-3 py-2.5">
                <p className="text-neutral-300 text-xs leading-relaxed line-clamp-4">{item.body}</p>
              </div>

              {item.scheduledAt && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span>Scheduled: {new Date(item.scheduledAt).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-700 text-xs">{new Date(item.createdAt).toLocaleDateString()}</span>
                <button onClick={() => { setEditItem(item); setShowCreate(true); }} className="text-xs text-neutral-400 hover:text-white transition-all">Edit →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <ContentModal item={editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} onSave={load} />
      )}
    </div>
  );
}

function ContentModal({ item, onClose, onSave }: { item: any; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    body: item?.body || "",
    type: item?.type || "POST",
    platform: item?.platform || "linkedin",
    scheduledAt: item?.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0,16) : "",
  });
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    const res = await fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-content", type: form.type, topic, platform: form.platform, tone: "professional, engaging" }),
    });
    if (res.ok) { const d = await res.json(); setForm(f => ({ ...f, body: d.content, title: f.title || topic })); }
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    const method = item ? "PUT" : "POST";
    const url = item ? `/api/content/${item.id}` : "/api/content";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, body: form.body }) });
    onSave(); onClose(); setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 sticky top-0 bg-neutral-900">
          <h2 className="text-sm font-semibold text-white">{item ? "Edit Content" : "Create Content"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-neutral-500 mb-1">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {["POST","POSTER","VIDEO_SCRIPT","JOB_POST"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="block text-xs text-neutral-500 mb-1">Platform</label>
              <select className="input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter/X</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select></div>
          </div>

          {/* AI Generator */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-neutral-400">⚡ AI Generator</p>
            <div className="flex gap-2">
              <input className="input flex-1" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter topic or idea to generate content..." onKeyDown={e => e.key === "Enter" && generate()} />
              <button onClick={generate} disabled={generating || !topic} className="btn-ghost flex items-center gap-1.5 flex-shrink-0">
                <Sparkles className={`w-3.5 h-3.5 ${generating ? "animate-pulse" : ""}`} />
                {generating ? "..." : "Generate"}
              </button>
            </div>
          </div>

          <div><label className="block text-xs text-neutral-500 mb-1">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Content title..." /></div>

          <div><label className="block text-xs text-neutral-500 mb-1">Content *</label>
            <textarea className="input !h-56 resize-none font-mono text-xs" value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Content will appear here after generation, or type manually..." /></div>

          <div><label className="block text-xs text-neutral-500 mb-1">Schedule (optional)</label>
            <input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} /></div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={saving || !form.title || !form.body} className="btn-primary">{saving ? "Saving..." : item ? "Update" : "Save Content"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
