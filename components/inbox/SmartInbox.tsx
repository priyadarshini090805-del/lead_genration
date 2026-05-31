"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles, RefreshCw, X, Users, MessageSquare, CheckCheck } from "lucide-react";

export function SmartInbox() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [aiReplies, setAiReplies] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadLeads() {
    setLoadingLeads(true);
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/leads?${params}`);
    if (res.ok) { const d = await res.json(); setLeads(d.leads); }
    setLoadingLeads(false);
  }

  async function loadMessages(leadId: string) {
    const res = await fetch(`/api/messages?leadId=${leadId}`);
    if (res.ok) { const d = await res.json(); setMessages(d.messages); }
    // Mark as read
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, action: "markRead" }) }).catch(() => {});
  }

  useEffect(() => { loadLeads(); }, [search]);
  useEffect(() => { if (selectedLead) loadMessages(selectedLead.id); }, [selectedLead]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    if (!newMsg.trim() || !selectedLead) return;
    setSending(true);
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead.id, content: newMsg, type: "INBOX_CHAT" }) });
    setNewMsg(""); await loadMessages(selectedLead.id); setSending(false); setAiReplies([]);
  }

  async function getAiReplies() {
    if (!messages.length) return;
    setLoadingAi(true);
    const lastIncoming = [...messages].reverse().find(m => m.isIncoming);
    if (!lastIncoming) { setLoadingAi(false); return; }
    const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "smart-replies", lastMessage: lastIncoming.content, leadName: selectedLead?.name }) });
    if (res.ok) { const d = await res.json(); setAiReplies(d.suggestions || []); }
    setLoadingAi(false);
  }

  const sentimentColor = (s?: string) => s === "POSITIVE" ? "text-green-400" : s === "NEGATIVE" ? "text-red-400" : "text-neutral-500";

  return (
    <div className="flex h-screen overflow-hidden" style={{ height: "calc(100vh - 0px)" }}>
      {/* Left: Lead list */}
      <div className="w-72 flex-shrink-0 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-white mb-3">Smart Inbox</h2>
          <input className="input text-xs" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingLeads ? (
            [...Array(5)].map((_, i) => <div key={i} className="px-4 py-3 border-b border-neutral-800/50"><div className="h-8 shimmer rounded" /></div>)
          ) : leads.map(lead => (
            <button key={lead.id} onClick={() => setSelectedLead(lead)}
              className={`w-full text-left px-4 py-3 border-b border-neutral-800/30 hover:bg-neutral-800/40 transition-all ${selectedLead?.id === lead.id ? "bg-neutral-800/60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                  {lead.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-xs font-medium truncate">{lead.name}</p>
                    {lead.unreadCount > 0 && <span className="bg-white text-black text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-4 text-center">{lead.unreadCount}</span>}
                  </div>
                  <p className="text-neutral-500 text-xs truncate">{lead.company || lead.platform}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Conversation */}
      {selectedLead ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-white">
                {selectedLead.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{selectedLead.name}</p>
                <p className="text-neutral-500 text-xs">{selectedLead.company || selectedLead.title || selectedLead.platform}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${selectedLead.platform === "linkedin" ? "bg-neutral-800 text-blue-400" : "bg-neutral-800 text-neutral-400"}`}>{selectedLead.platform}</span>
              <span className="badge badge-new">{selectedLead.status}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-neutral-600 text-sm">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isIncoming ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 text-sm ${msg.isIncoming ? "bg-neutral-800 text-white rounded-tl-sm" : "bg-white text-black rounded-tr-sm"}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-1.5 mt-1 text-xs ${msg.isIncoming ? sentimentColor(msg.sentiment) : "text-neutral-400"}`}>
                    {msg.sentiment && <span>{msg.sentiment === "POSITIVE" ? "↑" : msg.sentiment === "NEGATIVE" ? "↓" : "—"} {msg.sentiment}</span>}
                    <span>{msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}</span>
                    {!msg.isIncoming && <CheckCheck className="w-3 h-3 text-neutral-400" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* AI reply suggestions */}
          {aiReplies.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {aiReplies.map((r, i) => (
                <button key={i} onClick={() => setNewMsg(r)} className="text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white px-3 py-1.5 rounded-full transition-all">{r}</button>
              ))}
              <button onClick={() => setAiReplies([])} className="text-xs text-neutral-600 hover:text-white px-2 py-1.5"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-neutral-800 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                className="input flex-1 resize-none max-h-32 min-h-10"
                placeholder="Type a message..."
                rows={1}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={getAiReplies} disabled={loadingAi || !messages.length} title="Get AI reply suggestions"
                className="btn-ghost !p-2.5 flex-shrink-0">
                <Sparkles className={`w-4 h-4 ${loadingAi ? "animate-pulse" : ""}`} />
              </button>
              <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="btn-primary !p-2.5 flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-600">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 mb-3 mx-auto opacity-20" />
            <p className="text-sm">Select a lead to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
