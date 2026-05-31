"use client";
import { useState, useEffect } from "react";
import { Sparkles, Send, Clock, CheckCircle, Users, Zap, X, RefreshCw } from "lucide-react";

export function OutreachCenter() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [relay, setRelay] = useState("linkedin");
  const [msgType, setMsgType] = useState<"CONNECTION"|"FOLLOW_UP"|"PITCH"|"GROUP">("CONNECTION");
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<"compose"|"history"|"followups">("compose");

  useEffect(() => {
    fetch("/api/leads?limit=100").then(r => r.json()).then(d => setLeads(d.leads || []));
    fetch("/api/outreach").then(r => r.json()).then(d => setHistory(d.messages || []));
  }, []);

  async function generateMessage() {
    setGenerating(true);
    const isSingle = selectedLeads.size === 1;
    const lead = isSingle ? leads.find(l => selectedLeads.has(l.id)) : null;
    const res = await fetch("/api/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msgType === "GROUP"
        ? { action: "generate-group-message", topic: "business growth automation", platform: relay, audience: "LinkedIn connections" }
        : { action: "generate-message", leadName: lead?.name || "valued connection", platform: relay, notes: lead?.notes, type: msgType, company: lead?.company, title: lead?.title }),
    });
    if (res.ok) { const d = await res.json(); setMessage(d.content); }
    setGenerating(false);
  }

  async function sendMessages() {
    if (!message.trim() || !selectedLeads.size) return;
    setSending(true); setResult(null);
    const res = await fetch("/api/messages/group", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds: [...selectedLeads], content: message, type: msgType, platform: relay, scheduledFor: scheduledFor || null, relayId: relay }),
    });
    const d = await res.json();
    setResult(d); setSending(false);
    if (res.ok) {
      setMessage(""); setSelectedLeads(new Set()); setScheduledFor("");
      fetch("/api/outreach").then(r => r.json()).then(d => setHistory(d.messages || []));
    }
  }

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filteredLeads = leads.filter(l => relay === "all" || l.platform === relay);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Outreach Center</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Send AI-powered messages to leads via selected relay</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit">
        {(["compose","history","followups"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}>{t}</button>
        ))}
      </div>

      {tab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lead selector */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Select Leads</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">{selectedLeads.size} selected</span>
                <button onClick={() => setSelectedLeads(new Set(filteredLeads.map((l: any) => l.id)))} className="text-xs text-neutral-400 hover:text-white">All</button>
                <button onClick={() => setSelectedLeads(new Set())} className="text-xs text-neutral-400 hover:text-white">None</button>
              </div>
            </div>

            {/* Relay filter */}
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Relay (Platform)</label>
              <select className="input" value={relay} onChange={e => setRelay(e.target.value)}>
                <option value="linkedin">LinkedIn Relay</option>
                <option value="google">Google Relay</option>
                <option value="manual">Manual / Email Relay</option>
                <option value="all">All Relays</option>
              </select>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {filteredLeads.length === 0 && <p className="text-neutral-600 text-xs text-center py-4">No leads on this relay</p>}
              {filteredLeads.map((lead: any) => (
                <label key={lead.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${selectedLeads.has(lead.id) ? "bg-neutral-800" : "hover:bg-neutral-800/50"}`}>
                  <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => toggleLead(lead.id)} className="rounded" />
                  <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white flex-shrink-0">{lead.name[0]}</div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{lead.name}</p>
                    <p className="text-neutral-600 text-xs truncate">{lead.company || lead.status}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="lg:col-span-2 card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Compose Message</h3>
              <div className="flex bg-neutral-800 rounded-lg p-0.5">
                {(["CONNECTION","FOLLOW_UP","PITCH","GROUP"] as const).map(t => (
                  <button key={t} onClick={() => setMsgType(t)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${msgType === t ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}>
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={generateMessage} disabled={generating} className="btn-ghost flex items-center gap-1.5 text-xs">
                <Sparkles className={`w-3.5 h-3.5 ${generating ? "animate-pulse" : ""}`} />
                {generating ? "Generating..." : "AI Generate"}
              </button>
            </div>

            <textarea
              className="input !h-44 resize-none"
              placeholder={`Write your ${msgType.toLowerCase().replace("_"," ")} message here, or click AI Generate...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-neutral-500 mb-1">Schedule (optional)</label>
                <input type="datetime-local" className="input" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
              </div>
            </div>

            {result && (
              <div className={`p-3 rounded-lg text-xs ${result.sent ? "bg-white/5 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                {result.sent ? `✓ Sent to ${result.sent} leads via ${relay} relay` : result.error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Users className="w-3.5 h-3.5" />
                <span>{selectedLeads.size} recipient{selectedLeads.size !== 1 ? "s" : ""}</span>
                {scheduledFor && <><Clock className="w-3.5 h-3.5 ml-1" /><span>Scheduled</span></>}
              </div>
              <button onClick={sendMessages} disabled={sending || !message.trim() || !selectedLeads.size} className="btn-primary flex items-center gap-2">
                {sending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? "Sending..." : scheduledFor ? "Schedule" : `Send to ${selectedLeads.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-neutral-800">
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase">Lead</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase">Type</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase">Message</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase">Status</th>
              <th className="py-3 px-4 text-left text-xs text-neutral-500 uppercase">Sent</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-800/50">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-neutral-600 text-sm">No outreach history yet</td></tr>
              ) : history.map((m: any) => (
                <tr key={m.id} className="hover:bg-neutral-800/20">
                  <td className="py-3 px-4 text-white text-xs">{m.lead?.name || "—"}</td>
                  <td className="py-3 px-4"><span className="badge badge-new">{m.type}</span></td>
                  <td className="py-3 px-4 text-neutral-400 text-xs max-w-xs truncate">{m.content}</td>
                  <td className="py-3 px-4"><span className={`badge ${m.status === "SENT" ? "bg-white/10 text-green-400" : "badge-new"}`}>{m.status}</span></td>
                  <td className="py-3 px-4 text-neutral-600 text-xs">{m.sentAt ? new Date(m.sentAt).toLocaleDateString() : "Scheduled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "followups" && <FollowUpScheduler leads={leads} />}
    </div>
  );
}

function FollowUpScheduler({ leads }: { leads: any[] }) {
  const [selectedLead, setSelectedLead] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [autoGen, setAutoGen] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [err, setErr] = useState("");

  async function schedule() {
    setSaving(true); setSuccess(""); setErr("");
    const res = await fetch("/api/outreach", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead, type: "FOLLOW_UP", content: autoGen ? null : message, scheduledFor, autoGenerate: autoGen }),
    });
    const d = await res.json();
    if (res.ok) { setSuccess("Follow-up scheduled!"); setSelectedLead(""); setScheduledFor(""); setMessage(""); }
    else setErr(d.error);
    setSaving(false);
  }

  return (
    <div className="max-w-lg card space-y-4">
      <h3 className="text-sm font-medium text-white">Schedule Follow-Up</h3>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Lead</label>
        <select className="input" value={selectedLead} onChange={e => setSelectedLead(e.target.value)}>
          <option value="">Select a lead...</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.company || l.platform}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Send at</label>
        <input type="datetime-local" className="input" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={autoGen} onChange={e => setAutoGen(e.target.checked)} className="rounded" />
        <span className="text-sm text-neutral-300">Auto-generate message with AI</span>
      </label>
      {!autoGen && (
        <textarea className="input !h-28 resize-none" placeholder="Custom follow-up message..." value={message} onChange={e => setMessage(e.target.value)} />
      )}
      {success && <p className="text-green-400 text-xs bg-white/5 p-2 rounded-lg">{success}</p>}
      {err && <p className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg">{err}</p>}
      <button onClick={schedule} disabled={saving || !selectedLead || !scheduledFor} className="btn-primary flex items-center gap-2">
        {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
        Schedule Follow-Up
      </button>
    </div>
  );
}
