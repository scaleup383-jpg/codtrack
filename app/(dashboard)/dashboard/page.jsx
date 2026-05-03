"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    BarChart3, Users, Target, TrendingUp, DollarSign, Clock,
    CheckCircle2, XCircle, Package, ArrowUpRight, ArrowDownRight,
    RefreshCw, Loader2, AlertCircle, Activity, User,
    ShoppingCart, Globe, PieChart, AlertTriangle, BadgeCheck,
    Coins, GitBranch, AreaChart, Timer, Ban, CreditCard, Crown,
    X, Sparkles, Shield, Calendar, Rocket, Star,
    Filter, ChevronRight, Download, ChevronDown
} from "lucide-react";
import {
    Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Area, ComposedChart, BarChart, Bar, Cell, PieChart as RechartsPie,
    Pie, LabelList, Legend,
} from "recharts";

/* ================================================================
   ACCOUNT STATUS BANNER (unchanged)
================================================================ */
function AccountStatusBanner({ tenant }) {
    const [dismissed, setDismissed] = useState(false);
    if (!tenant || dismissed) return null;
    const now = new Date();
    const isDisabled = tenant.plan === "disabled";
    const subEnd = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null;
    const subExpired = subEnd && subEnd < now;
    const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : tenant.created_at ? new Date(new Date(tenant.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    const trialExpired = trialEnd && trialEnd < now && tenant.plan === "starter";
    const isSuspended = tenant.status === "suspended";
    const isInactive = tenant.status === "inactive";
    const subExpSoon = subEnd && !subExpired && (subEnd - now) < 7 * 24 * 60 * 60 * 1000;
    const trialExpSoon = trialEnd && !trialExpired && tenant.plan === "starter" && (trialEnd - now) < 7 * 24 * 60 * 60 * 1000;
    const days = (end) => Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    let config = null;
    if (isDisabled) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: Ban, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Disabled", subtitle: "Contact support", message: "Your workspace has been disabled.", action: "Contact Support", link: "/contact" };
    else if (isSuspended) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Suspended", subtitle: "Access revoked", message: "Your workspace has been suspended.", action: "Contact Support", link: "/contact" };
    else if (isInactive) config = { type: "critical", gradient: "from-red-500 to-rose-600", bg: "bg-gradient-to-r from-red-50 via-rose-50 to-red-50", border: "border-red-300", text: "text-red-800", icon: XCircle, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Account Inactive", subtitle: "Workspace dormant", message: "Your workspace is inactive.", action: "Reactivate", link: "/settings?tab=billing" };
    else if (subExpired) config = { type: "critical", gradient: "from-amber-500 to-orange-600", bg: "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50", border: "border-amber-300", text: "text-amber-900", icon: CreditCard, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Subscription Expired", subtitle: `Expired ${days(subEnd)}d ago`, message: `Expired on ${subEnd.toLocaleDateString()}.`, action: "Renew", link: "/settings?tab=billing" };
    else if (trialExpired) config = { type: "critical", gradient: "from-amber-500 to-orange-600", bg: "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50", border: "border-amber-300", text: "text-amber-900", icon: Timer, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Trial Expired", subtitle: `Ended ${days(trialEnd)}d ago`, message: `Ended on ${trialEnd.toLocaleDateString()}.`, action: "Upgrade", link: "/upgrade" };
    else if (subExpSoon) config = { type: "warning", gradient: "from-amber-400 to-yellow-500", bg: "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50", border: "border-amber-200", text: "text-amber-800", icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Expiring Soon", subtitle: `${days(subEnd)}d left`, message: `Expires on ${subEnd.toLocaleDateString()}.`, action: "Renew", link: "/settings?tab=billing" };
    else if (trialExpSoon) config = { type: "warning", gradient: "from-amber-400 to-yellow-500", bg: "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50", border: "border-amber-200", text: "text-amber-800", icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: "Trial Ending", subtitle: `${days(trialEnd)}d left`, message: `Ends on ${trialEnd.toLocaleDateString()}.`, action: "Upgrade", link: "/upgrade" };
    else if (tenant.plan === "starter") config = { type: "info", gradient: "from-emerald-400 to-green-500", bg: "bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: Sparkles, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", title: "Free Trial Active", subtitle: trialEnd ? `${days(trialEnd)}d remaining` : "Active", message: "You're on the Starter plan.", action: "Upgrade", link: "/upgrade" };
    else config = { type: "info", gradient: "from-blue-400 to-indigo-500", bg: "bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50", border: "border-blue-200", text: "text-blue-800", icon: Crown, iconBg: "bg-blue-100", iconColor: "text-blue-600", title: `${tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1)} Plan Active`, subtitle: subEnd ? `${days(subEnd)}d until renewal` : "Active", message: "Your subscription is active.", action: "Manage", link: "/settings?tab=billing" };
    if (!config) return null;
    const Icn = config.icon;
    return (
        <div className={`${config.bg} ${config.border} border-2 rounded-3xl p-5 shadow-lg relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${config.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none`} />
            <div className="relative flex items-start gap-4">
                <div className={`${config.iconBg} p-3 rounded-2xl flex-shrink-0`}><Icn size={22} className={config.iconColor} /></div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><h3 className={`text-base font-bold ${config.text}`}>{config.title}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.type === "critical" ? "bg-red-100 text-red-700" : config.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{config.subtitle}</span></div>
                    <p className={`text-sm ${config.text} opacity-80 mb-2`}>{config.message}</p>
                    <a href={config.link} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all hover:scale-105 bg-gradient-to-r ${config.gradient}`}>{config.action} <ChevronRight size={12} /></a>
                </div>
                <button onClick={() => setDismissed(true)} className="p-2 rounded-xl hover:bg-black/5 flex-shrink-0"><X size={15} className={config.text} /></button>
            </div>
        </div>
    );
}

/* ================================================================
   SKELETONS
================================================================ */
function KpiSkeleton() { return <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"><div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" /><div className="space-y-2"><div className="h-3 w-20 bg-gray-200 rounded" /><div className="h-7 w-24 bg-gray-200 rounded" /></div></div>; }
function ChartSkeleton() { return <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"><div className="w-10 h-10 bg-gray-200 rounded-xl mb-6" /><div className="h-64 bg-gray-100 rounded-xl" /></div>; }

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
            {payload.map((e, i) => <div key={i} className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} /><span className="text-gray-600">{e.name}:</span><span className="font-bold text-gray-900">{e.name?.toLowerCase().includes("revenue") ? `$${Number(e.value).toLocaleString()}` : Number(e.value).toLocaleString()}</span></div>)}
        </div>
    );
}

/* ================================================================
   METRIC OPTIONS FOR DROPDOWN
================================================================ */
const METRIC_OPTIONS = [
    { value: "revenue", label: "Revenue", color: "#10b981", format: (v) => `$${v.toLocaleString()}` },
    { value: "orders", label: "Orders", color: "#3b82f6", format: (v) => v.toLocaleString() },
    { value: "confirmed", label: "Confirmed", color: "#8b5cf6", format: (v) => v.toLocaleString() },
    { value: "delivered", label: "Delivered", color: "#f59e0b", format: (v) => v.toLocaleString() },
];

const TIME_RANGES = [
    { value: "7d", label: "7 Days", days: 7 },
    { value: "15d", label: "15 Days", days: 15 },
    { value: "30d", label: "30 Days", days: 30 },
    { value: "90d", label: "90 Days", days: 90 },
    { value: "6m", label: "6 Months", days: 180 },
    { value: "1y", label: "1 Year", days: 365 },
    { value: "all", label: "All Time", days: null },
];

/* ================================================================
   MAIN DASHBOARD
================================================================ */
export default function AnalyticsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [leads, setLeads] = useState([]);
    const [agents, setAgents] = useState([]);

    // Time & metric filters
    const [timeRange, setTimeRange] = useState("30d");
    const [selectedMetric, setSelectedMetric] = useState("revenue");
    const [showMetricDropdown, setShowMetricDropdown] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Auto-refresh every 5 minutes
    const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError("Please sign in"); setLoading(false); return; }

            const { data: p } = await supabase.from("user_profiles").select("id,tenant_id,role,full_name").eq("id", user.id).single();
            if (!p) { setError("No profile"); setLoading(false); return; }

            const { data: t } = await supabase.from("tenants").select("*").eq("id", p.tenant_id).single();
            if (t) setTenant(t);

            const { data: l } = await supabase.from("leads").select("*").eq("tenant_id", p.tenant_id).order("date", { ascending: false });
            setLeads(l || []);

            const { data: a } = await supabase.from("user_profiles").select("id,full_name,role").eq("tenant_id", p.tenant_id);
            setAgents(a || []);

            setLastRefreshed(new Date());
        } catch (err) { setError(err.message); }
        finally { if (!silent) setLoading(false); }
    }, []);

    // Initial fetch
    useEffect(() => { fetchData(); }, [fetchData]);

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            console.log("🔄 Auto-refreshing dashboard data...");
            fetchData(true);
        }, AUTO_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Computed analytics with time filter
    const analytics = useMemo(() => {
        const now = new Date();
        const selectedRange = TIME_RANGES.find(r => r.value === timeRange);

        // Filter leads by time range
        let filteredLeads = leads;
        if (selectedRange?.days) {
            const cutoff = new Date(now.getTime() - selectedRange.days * 24 * 60 * 60 * 1000);
            filteredLeads = leads.filter(l => l.date && new Date(l.date) >= cutoff);
        }

        const total = filteredLeads.length;
        const pending = filteredLeads.filter(l => l.status === "pending").length;
        const confirmed = filteredLeads.filter(l => l.status === "confirmed").length;
        const delivered = filteredLeads.filter(l => l.status === "delivered").length;
        const cancelled = filteredLeads.filter(l => l.status === "cancelled").length;
        const revenue = filteredLeads.filter(l => l.status === "delivered").reduce((s, l) => s + (Number(l.amount) || 0), 0);
        const convRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0;
        const avgOrder = confirmed > 0 ? revenue / confirmed : 0;
        const delRate = confirmed > 0 ? ((delivered / confirmed) * 100).toFixed(1) : 0;

        // Build chart data based on time range
        const chartData = [];
        const days = selectedRange?.days || 30;
        const actualDays = selectedRange?.days ? Math.min(days, 365) : Math.min(
            leads.length > 0 ? Math.ceil((now - new Date(leads[leads.length - 1]?.date || now)) / (1000 * 60 * 60 * 24)) : 30,
            365
        );

        for (let i = actualDays - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const dayLeads = filteredLeads.filter(l => l.date && new Date(l.date).toISOString().split("T")[0] === dateStr);

            chartData.push({
                date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                revenue: dayLeads.filter(l => l.status === "delivered").reduce((s, l) => s + (Number(l.amount) || 0), 0),
                orders: dayLeads.length,
                confirmed: dayLeads.filter(l => l.status === "confirmed" || l.status === "delivered").length,
                delivered: dayLeads.filter(l => l.status === "delivered").length,
            });
        }

        // For comparison: previous period
        const comparisonData = [];
        for (let i = actualDays - 1; i >= 0; i--) {
            const currentDate = new Date(now); currentDate.setDate(currentDate.getDate() - i);
            const currentStr = currentDate.toISOString().split("T")[0];
            const currentDayLeads = filteredLeads.filter(l => l.date && new Date(l.date).toISOString().split("T")[0] === currentStr);

            const prevDate = new Date(currentDate); prevDate.setDate(prevDate.getDate() - actualDays);
            const prevStr = prevDate.toISOString().split("T")[0];
            const prevDayLeads = leads.filter(l => l.date && new Date(l.date).toISOString().split("T")[0] === prevStr);

            comparisonData.push({
                date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                currentRevenue: currentDayLeads.filter(l => l.status === "delivered").reduce((s, l) => s + (Number(l.amount) || 0), 0),
                previousRevenue: prevDayLeads.filter(l => l.status === "delivered").reduce((s, l) => s + (Number(l.amount) || 0), 0),
                currentOrders: currentDayLeads.length,
                previousOrders: prevDayLeads.length,
                currentConfirmed: currentDayLeads.filter(l => l.status === "confirmed" || l.status === "delivered").length,
                previousConfirmed: prevDayLeads.filter(l => l.status === "confirmed" || l.status === "delivered").length,
                currentDelivered: currentDayLeads.filter(l => l.status === "delivered").length,
                previousDelivered: prevDayLeads.filter(l => l.status === "delivered").length,
            });
        }

        const pipeline = [{ name: "Pending", value: pending, fill: "#8b5cf6" }, { name: "Confirmed", value: confirmed, fill: "#3b82f6" }, { name: "Delivered", value: delivered, fill: "#10b981" }, { name: "Cancelled", value: cancelled, fill: "#ef4444" }];

        const prodMap = {};
        filteredLeads.forEach(l => { if (!l.product) return; if (!prodMap[l.product]) prodMap[l.product] = { name: l.product, count: 0, revenue: 0 }; prodMap[l.product].count++; if (l.status === "delivered") prodMap[l.product].revenue += Number(l.amount) || 0; });
        const topProds = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

        const srcMap = {};
        filteredLeads.forEach(l => { const s = l.source || "Direct"; srcMap[s] = (srcMap[s] || 0) + 1; });
        const sources = Object.entries(srcMap).map(([n, v]) => ({ name: n, value: v }));
        const SRC_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

        const team = agents.filter(a => a.role !== "owner").map(a => { const al = filteredLeads.filter(l => l.assigned_to === a.id), c = al.filter(l => l.status === "confirmed" || l.status === "delivered").length; return { name: a.full_name, role: a.role, leads: al.length, confirmed: c, conversion: al.length > 0 ? Number(((c / al.length) * 100).toFixed(0)) : 0, revenue: al.filter(l => l.status === "delivered").reduce((s, l) => s + (Number(l.amount) || 0), 0) }; }).sort((a, b) => b.leads - a.leads);

        const recent = filteredLeads.slice(0, 10).map(l => ({ ...l, agentName: agents.find(a => a.id === l.assigned_to)?.full_name || "Unassigned", timeAgo: getTimeAgo(l.date) }));

        return { total, pending, confirmed, delivered, cancelled, revenue, convRate, avgOrder, delRate, chartData, comparisonData, pipeline, topProds, sources, SRC_COLORS, team, recent, actualDays };
    }, [leads, agents, timeRange]);

    const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v || 0);
    function getTimeAgo(d) { if (!d) return "N/A"; const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (diff < 60) return "just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; }

    const roleColors = { admin: { bg: "#dbeafe", color: "#3b82f6", label: "Admin" }, confirmation_agent: { bg: "#dcfce7", color: "#22c55e", label: "Conf. Agent" }, stock_manager: { bg: "#ede9fe", color: "#8b5cf6", label: "Stock Mgr" }, analyst: { bg: "#cffafe", color: "#06b6d4", label: "Analyst" }, agent: { bg: "#d1fae5", color: "#10b981", label: "Agent" }, viewer: { bg: "#f3f4f6", color: "#6b7280", label: "Viewer" } };

    const selectedMetricConfig = METRIC_OPTIONS.find(m => m.value === selectedMetric) || METRIC_OPTIONS[0];

    if (loading) return <div className="min-h-screen bg-gray-50"><div className="max-w-[1600px] mx-auto p-6 lg:p-8 space-y-6"><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <KpiSkeleton key={i} />)}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ChartSkeleton /><ChartSkeleton /></div></div></div>;
    if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="bg-white rounded-3xl p-10 text-center shadow-xl max-w-md"><AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Error</h2><p className="text-gray-500 mb-4">{error}</p><button onClick={() => fetchData()} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold">Retry</button></div></div>;

    const plan = tenant?.plan || "starter";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                <AccountStatusBanner tenant={tenant} />

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl shadow-green-200"><BarChart3 className="w-6 h-6 text-white" /></div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">{tenant?.name || "Workspace"}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan === "enterprise" ? "bg-purple-100 text-purple-700" : plan === "pro" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{plan.toUpperCase()}</span>
                                {lastRefreshed && <span className="text-[10px] text-gray-400 ml-2">Updated {getTimeAgo(lastRefreshed.toISOString())}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => fetchData(true)} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm" title="Refresh data">
                            <RefreshCw size={16} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[{ label: "Total Leads", value: analytics.total, icon: Users, color: "#6366f1", bg: "#eef2ff" }, { label: "Pending", value: analytics.pending, icon: Clock, color: "#f59e0b", bg: "#fffbeb" }, { label: "Confirmed", value: analytics.confirmed, icon: CheckCircle2, color: "#3b82f6", bg: "#eff6ff" }, { label: "Delivered", value: analytics.delivered, icon: Package, color: "#10b981", bg: "#ecfdf5" }, { label: "Revenue", value: fmt(analytics.revenue), icon: DollarSign, color: "#8b5cf6", bg: "#f5f3ff" }, { label: "Conversion", value: `${analytics.convRate}%`, icon: TrendingUp, color: "#06b6d4", bg: "#ecfeff" }].map((k, i) => { const I = k.icon; return <div key={i} className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 group overflow-hidden"><div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: k.color }} /><div className="flex items-start justify-between mb-3"><div className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: k.bg }}><I size={18} style={{ color: k.color }} /></div><ArrowUpRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors" /></div><p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{k.label}</p><h3 className="text-2xl font-bold text-gray-900 font-mono">{k.value}</h3></div> })}
                </div>

                {/* TIME FILTER + METRIC DROPDOWN */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                        {TIME_RANGES.map(r => (
                            <button key={r.value} onClick={() => setTimeRange(r.value)}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${timeRange === r.value ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {/* Metric Dropdown */}
                    <div className="relative">
                        <button onClick={() => setShowMetricDropdown(!showMetricDropdown)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedMetricConfig.color }} />
                            {selectedMetricConfig.label}
                            <ChevronDown size={14} className={`transition-transform ${showMetricDropdown ? "rotate-180" : ""}`} />
                        </button>
                        {showMetricDropdown && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-48 overflow-hidden" onClick={() => setShowMetricDropdown(false)}>
                                {METRIC_OPTIONS.map(m => (
                                    <button key={m.value} onClick={() => { setSelectedMetric(m.value); setShowMetricDropdown(false); }}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all hover:bg-gray-50 ${selectedMetric === m.value ? "bg-emerald-50 text-emerald-700" : "text-gray-600"}`}>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* UNIFIED COMPARISON CHART */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-xl"><AreaChart size={20} className="text-emerald-600" /></div>
                            <div>
                                <h3 className="font-bold text-gray-900">{selectedMetricConfig.label} Comparison</h3>
                                <p className="text-xs text-gray-500">Current period vs previous period ({analytics.actualDays} days)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2"><div className="w-3 h-0.5 rounded-full bg-emerald-500" style={{ height: 3 }} /><span className="text-xs text-gray-500">Current</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-0.5 rounded-full bg-gray-300" style={{ height: 3 }} /><span className="text-xs text-gray-500">Previous</span></div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={analytics.comparisonData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="currentGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={selectedMetricConfig.color} stopOpacity={0.3} /><stop offset="100%" stopColor={selectedMetricConfig.color} stopOpacity={0} /></linearGradient>
                                <linearGradient id="previousGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d1d5db" stopOpacity={0.2} /><stop offset="100%" stopColor="#d1d5db" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={Math.floor(analytics.actualDays / 8)} />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={selectedMetric === "revenue" ? v => `$${(v / 1000).toFixed(0)}k` : v => v.toString()} />
                            <Tooltip content={<CustomTooltip />} />
                            {/* Previous period area */}
                            <Area type="monotone" dataKey={`previous${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} fill="url(#previousGrad2)" stroke="none" name={`Previous ${selectedMetricConfig.label}`} />
                            {/* Current period area */}
                            <Area type="monotone" dataKey={`current${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} fill="url(#currentGrad2)" stroke="none" name={`Current ${selectedMetricConfig.label}`} />
                            {/* Previous period line */}
                            <Line type="monotone" dataKey={`previous${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} stroke="#d1d5db" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#9ca3af", stroke: "#fff", strokeWidth: 2 }} name={`Previous ${selectedMetricConfig.label}`} />
                            {/* Current period line */}
                            <Line type="monotone" dataKey={`current${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} stroke={selectedMetricConfig.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: selectedMetricConfig.color, stroke: "#fff", strokeWidth: 2 }} name={`Current ${selectedMetricConfig.label}`} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* CHARTS ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Lead Pipeline */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-50 rounded-xl"><GitBranch size={20} className="text-purple-600" /></div><div><h3 className="font-bold text-gray-900">Lead Pipeline</h3><p className="text-xs text-gray-500">Status distribution</p></div></div>
                        {analytics.total === 0 ? <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No leads yet</div> : <ResponsiveContainer width="100%" height={280}><BarChart data={analytics.pipeline} layout="vertical" margin={{ left: 20, right: 30 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} width={80} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28} name="Leads">{analytics.pipeline.map((e, i) => <Cell key={i} fill={e.fill} />)}<LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} /></Bar></BarChart></ResponsiveContainer>}
                    </div>

                    {/* Source Analytics */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 rounded-xl"><Globe size={20} className="text-blue-600" /></div><div><h3 className="font-bold text-gray-900">Lead Sources</h3><p className="text-xs text-gray-500">Where leads come from</p></div></div>
                        {analytics.sources.length === 0 ? <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No source data</div> : <div className="flex items-center gap-8"><ResponsiveContainer width="55%" height={240}><RechartsPie><Pie data={analytics.sources} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name">{analytics.sources.map((_, i) => <Cell key={i} fill={analytics.SRC_COLORS[i % analytics.SRC_COLORS.length]} stroke="white" strokeWidth={2} />)}</Pie><Tooltip content={<CustomTooltip />} /></RechartsPie></ResponsiveContainer><div className="flex-1 space-y-2">{analytics.sources.map((s, i) => <div key={s.name} className="flex items-center gap-2 text-sm"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: analytics.SRC_COLORS[i % analytics.SRC_COLORS.length] }} /><span className="text-gray-600 flex-1">{s.name}</span><span className="font-bold text-gray-900">{s.value}</span></div>)}</div></div>}
                    </div>

                    {/* Team Snapshot */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-cyan-50 rounded-xl"><Users size={20} className="text-cyan-600" /></div><div><h3 className="font-bold text-gray-900">Team Snapshot</h3><p className="text-xs text-gray-500">Agent performance</p></div></div>
                        {analytics.team.length === 0 ? <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No team members</div> : <div className="space-y-4">{analytics.team.slice(0, 8).map((a, i) => { const rc = roleColors[a.role] || { bg: "#f3f4f6", color: "#6b7280", label: a.role }; return <div key={i} className="space-y-2"><div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: rc.color }}>{a.name?.[0]?.toUpperCase() || "?"}</div><div><span className="font-medium text-gray-700 text-xs">{a.name}</span><span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1.5" style={{ backgroundColor: rc.bg, color: rc.color }}>{rc.label}</span></div></div><div className="flex items-center gap-3"><span className="text-xs text-gray-500">{a.leads} leads</span><span className="text-xs font-bold text-emerald-600">{a.conversion}%</span></div></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(a.conversion, 100)}%`, background: `linear-gradient(90deg,${rc.color}99,${rc.color})` }} /></div></div> })}</div>}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-rose-50 rounded-xl"><Activity size={20} className="text-rose-600" /></div><div><h3 className="font-bold text-gray-900">Recent Activity</h3><p className="text-xs text-gray-500">Latest lead updates</p></div></div>
                        {analytics.recent.length === 0 ? <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No activity</div> : <div className="space-y-1">{analytics.recent.map(l => <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"><div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.status === "delivered" ? "bg-emerald-500" : l.status === "confirmed" ? "bg-blue-500" : l.status === "cancelled" ? "bg-red-500" : "bg-amber-500"}`} /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{l.customer || "Unknown"} · {l.product || "N/A"}</p><p className="text-xs text-gray-400 truncate">{l.status} · {l.agentName}</p></div><span className="text-[10px] text-gray-400 flex-shrink-0">{l.timeAgo}</span></div>)}</div>}
                    </div>
                </div>

                {/* QUICK STATS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[{ label: "Avg Order Value", value: fmt(analytics.avgOrder), icon: Coins, color: "#f59e0b" }, { label: "Delivery Rate", value: `${analytics.delRate}%`, icon: BadgeCheck, color: "#10b981" }, { label: "Total Orders", value: analytics.total, icon: ShoppingCart, color: "#6366f1" }, { label: "Team Members", value: analytics.team.length, icon: User, color: "#06b6d4" }].map((s, i) => { const I = s.icon; return <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"><div className="p-2.5 rounded-xl" style={{ backgroundColor: `${s.color}15` }}><I size={18} style={{ color: s.color }} /></div><div><p className="text-xs text-gray-500">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div></div> })}
                </div>
            </div>
        </div>
    );
}