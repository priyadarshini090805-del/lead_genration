"use client";
import { useState, useEffect } from "react";
import { Link2, CheckCircle, XCircle, RefreshCw, ExternalLink, AlertCircle, Linkedin, Globe } from "lucide-react";
import { signIn } from "next-auth/react";

const PROVIDERS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Import leads from LinkedIn, send connection requests and messages via LinkedIn relay",
    icon: "in",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    authAction: () => signIn("linkedin", { callbackUrl: "/dashboard/integrations" }),
  },
  {
    id: "google",
    name: "Google",
    description: "Sign in with Google to import contacts and use Google relay for outreach",
    icon: "G",
    color: "text-red-400",
    bg: "bg-red-400/10",
    authAction: () => signIn("google", { callbackUrl: "/dashboard/integrations" }),
  },
];

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/integrations");
    if (res.ok) { const d = await res.json(); setIntegrations(d.integrations); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function disconnect(provider: string) {
    if (!confirm(`Disconnect ${provider}?`)) return;
    await fetch("/api/integrations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });
    load();
  }

  function getIntegration(provider: string) {
    return integrations.find(i => i.provider === provider);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Integrations</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Connect your social accounts to enable lead import and outreach</p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map(provider => {
          const integration = getIntegration(provider.id);
          const isConnected = !!integration;
          return (
            <div key={provider.id} className="card flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl ${provider.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-lg font-bold ${provider.color}`}>{provider.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-white font-medium text-sm">{provider.name}</h3>
                  {isConnected ? (
                    <span className="badge bg-white/10 text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="badge badge-new flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Not connected
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 text-xs">{provider.description}</p>
                {isConnected && integration.lastSyncAt && (
                  <p className="text-neutral-700 text-xs mt-1">Last sync: {new Date(integration.lastSyncAt).toLocaleString()}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isConnected ? (
                  <>
                    <button onClick={() => disconnect(provider.id)} className="btn-ghost !text-red-400 !border-red-400/20 text-xs !py-1.5 !px-3">
                      Disconnect
                    </button>
                    <button onClick={provider.authAction} className="btn-ghost text-xs !py-1.5 !px-3 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3" /> Reconnect
                    </button>
                  </>
                ) : (
                  <button onClick={provider.authAction} className="btn-primary text-xs !py-1.5 !px-4">
                    Connect {provider.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div className="card border-neutral-800/50 bg-neutral-900/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-neutral-500 space-y-1.5">
            <p><strong className="text-neutral-400">LinkedIn API:</strong> Connecting LinkedIn enables profile import and relay messaging. Full lead search requires LinkedIn Marketing API Partner access.</p>
            <p><strong className="text-neutral-400">Google:</strong> Google OAuth allows sign-in and contact sync. Outreach via Google relay uses Gmail API (requires additional scope approval).</p>
            <p><strong className="text-neutral-400">Relay:</strong> When sending group messages in Outreach Center, choose which relay (platform) to route messages through.</p>
          </div>
        </div>
      </div>

      {/* Manual token connect */}
      <ManualTokenConnect onSave={load} />
    </div>
  );
}

function ManualTokenConnect({ onSave }: { onSave: () => void }) {
  const [provider, setProvider] = useState("linkedin");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/integrations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, accessToken: token }),
    });
    if (res.ok) { setMsg("Connected!"); setToken(""); onSave(); }
    else { const d = await res.json(); setMsg(d.error); }
    setSaving(false);
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-medium text-white">Manual Token Connect</h3>
      <p className="text-neutral-500 text-xs">Already have an API access token? Connect it directly here.</p>
      <div className="grid grid-cols-3 gap-3">
        <select className="input" value={provider} onChange={e => setProvider(e.target.value)}>
          <option value="linkedin">LinkedIn</option>
          <option value="google">Google</option>
        </select>
        <input className="input col-span-2" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste access token..." />
      </div>
      {msg && <p className={`text-xs ${msg === "Connected!" ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
      <button onClick={save} disabled={saving || !token} className="btn-primary text-xs !py-1.5 !px-4">
        {saving ? "Connecting..." : "Connect"}
      </button>
    </div>
  );
}
