"use client";
import { useState, useEffect } from "react";
import { Users, MessageSquare, TrendingUp, Target, ArrowUpRight, Download, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export function AnalyticsDashboard({ user }: { user: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/analytics?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]);

  const s = data?.summary;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Welcome back, {user?.name?.split(" ")[0] || "there"}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => setDays(+e.target.value)} className="input !w-auto text-xs py-1.5">
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button onClick={load} className="btn-ghost !py-1.5 !px-3 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <a href="/api/analytics/export" className="btn-primary flex items-center gap-1.5 !py-1.5 !px-3">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24 shimmer" />)}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Leads" value={s?.leads.total ?? 0} sub={`${s?.leads.new ?? 0} new`} />
            <StatCard icon={MessageSquare} label="Messages Sent" value={s?.messaging.sent ?? 0} sub={`${s?.messaging.replyRate ?? 0}% reply rate`} />
            <StatCard icon={TrendingUp} label="Converted" value={s?.leads.converted ?? 0} sub={`${s?.conversionRate ?? 0}% rate`} />
            <StatCard icon={Target} label="Active Campaigns" value={s?.campaigns.active ?? 0} sub={`${s?.campaigns.total ?? 0} total`} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Line chart */}
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-medium text-white mb-4">Lead & Message Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data?.chartData || []}>
                  <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#525252", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#a3a3a3" }} />
                  <Line type="monotone" dataKey="leads" stroke="#ffffff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="messages" stroke="#525252" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-white rounded" /><span className="text-xs text-neutral-500">Leads</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-neutral-500 rounded" /><span className="text-xs text-neutral-500">Messages</span></div>
              </div>
            </div>

            {/* Platform distribution */}
            <div className="card">
              <h3 className="text-sm font-medium text-white mb-4">Lead Sources</h3>
              <div className="space-y-3">
                {[
                  { label: "LinkedIn", value: s?.platforms.linkedin ?? 0, color: "bg-blue-500" },
                  { label: "Google", value: s?.platforms.google ?? 0, color: "bg-red-500" },
                  { label: "Manual", value: s?.platforms.manual ?? 0, color: "bg-neutral-500" },
                ].map(item => {
                  const total = (s?.leads.total || 1);
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-400">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "New", value: s?.leads.new ?? 0 },
                  { label: "Contacted", value: s?.leads.contacted ?? 0 },
                  { label: "Converted", value: s?.leads.converted ?? 0 },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-white font-semibold text-sm">{item.value}</p>
                    <p className="text-neutral-600 text-xs">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment + recent activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-white mb-4">Reply Sentiment</h3>
              <div className="space-y-2">
                {[
                  { label: "Positive", value: s?.sentiment.positive ?? 0, color: "bg-white", text: "text-green-400" },
                  { label: "Neutral", value: s?.sentiment.neutral ?? 0, color: "bg-neutral-600", text: "text-neutral-400" },
                  { label: "Negative", value: s?.sentiment.negative ?? 0, color: "bg-neutral-800", text: "text-red-400" },
                ].map(item => {
                  const total = (s?.messaging.received || 1);
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className={`text-xs w-16 ${item.text}`}>{item.label}</span>
                      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-neutral-500 w-8 text-right">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-white mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {data?.recentActivity?.length ? data.recentActivity.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === "SUCCESS" ? "bg-white" : "bg-red-500"}`} />
                    <span className="text-neutral-400 flex-1 truncate">{a.action.replace(/_/g, " ")}: {a.details}</span>
                    <span className="text-neutral-600">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                )) : (
                  <p className="text-neutral-600 text-xs">No activity yet. Start importing leads!</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub: string }) {
  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 text-neutral-500" />
        <ArrowUpRight className="w-3.5 h-3.5 text-neutral-700" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      </div>
      <p className="text-xs text-neutral-600">{sub}</p>
    </div>
  );
}
