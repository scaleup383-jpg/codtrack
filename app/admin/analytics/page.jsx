"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    BarChart3, TrendingUp, DollarSign, Loader2,
    ArrowUpRight, ArrowDownRight, RefreshCw, Crown, Star, Zap,
    Calendar, CreditCard, AlertTriangle, Activity,
    Target, Trophy, Award, Medal, Rocket,
    Clock, CheckCircle2, TrendingDown, Wallet,
    Sparkles, ArrowDown, AreaChart, LineChart,
    BadgeCheck, Timer, Coins
} from "lucide-react";
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, BarChart, Bar,
    Cell, LabelList, Legend,
} from "recharts";

/* ================================================================
   PRICING CONFIG
================================================================ */
const PRICING = {
    starter: { label: "Starter", price: 19, interval: "monthly", monthlyEquivalent: 19, color: "#f59e0b", gradient: "from-amber-400 to-yellow-500", icon: Zap },
    pro: { label: "Pro", price: 49, interval: "quarterly", monthlyEquivalent: 16.33, color: "#3b82f6", gradient: "from-blue-400 to-indigo-500", icon: Star },
    enterprise: { label: "Enterprise", price: 98, interval: "semi-annual", monthlyEquivalent: 16.33, color: "#8b5cf6", gradient: "from-purple-400 to-violet-500", icon: Crown },
};

/* ================================================================
   CUSTOM TOOLTIP
================================================================ */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 min-w-[220px]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{label}</p>
            {payload.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 mb-2 last:mb-0">
                    <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <div className="flex-1 flex items-center justify-between gap-4">
                        <span className="text-sm text-gray-600">{entry.name}:</span>
                        <span className="text-sm font-bold text-gray-900">
                            {entry.name?.toLowerCase().includes("revenue") || entry.name?.toLowerCase().includes("amount")
                                ? `$${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : Number(entry.value).toLocaleString()}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ================================================================
   MAIN ANALYTICS PAGE
================================================================ */
export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState("monthly");

    const fetchData = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const { data } = await supabase.from("tenants").select("id, name, plan, created_at, subscription_ends_at");
            setTenants(data || []);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const analytics = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const activeTenants = tenants.filter(t => t.plan !== "disabled");

        // Today
        const todaySubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= today && d < new Date(today.getTime() + 24 * 60 * 60 * 1000); });
        const todayRevenue = todaySubs.reduce((sum, t) => sum + (PRICING[t.plan]?.price || 0), 0);

        // This month
        const thisMonthSubs = activeTenants.filter(t => new Date(t.created_at) >= thisMonth);
        const thisMonthRevenue = thisMonthSubs.reduce((sum, t) => sum + (PRICING[t.plan]?.price || 0), 0);

        // Last month
        const lastMonthSubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= lastMonth && d < thisMonth; });
        const lastMonthRevenue = lastMonthSubs.reduce((sum, t) => sum + (PRICING[t.plan]?.price || 0), 0);

        const monthlyProjected = activeTenants.reduce((sum, t) => sum + (PRICING[t.plan]?.monthlyEquivalent || 0), 0);
        const totalRevenue = activeTenants.reduce((sum, t) => sum + (PRICING[t.plan]?.price || 0), 0);

        // Growth rate
        const growthRate = lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 0;

        // Plan counts
        const starterCount = activeTenants.filter(t => t.plan === "starter").length;
        const proCount = activeTenants.filter(t => t.plan === "pro").length;
        const enterpriseCount = activeTenants.filter(t => t.plan === "enterprise").length;
        const starterRevenue = starterCount * PRICING.starter.price;
        const proRevenue = proCount * PRICING.pro.price;
        const enterpriseRevenue = enterpriseCount * PRICING.enterprise.price;

        // Daily subscriptions (last 30 days) - for bar chart
        const dailySubs = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now); date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const dayStart = new Date(dateStr), dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            const daySubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= dayStart && d < dayEnd; });
            dailySubs.push({ date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: daySubs.length, revenue: daySubs.reduce((s, t) => s + (PRICING[t.plan]?.price || 0), 0) });
        }

        // Monthly subscriptions (last 12 months)
        const monthlySubs = [];
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            const monthSubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= monthDate && d <= monthEnd; });
            monthlySubs.push({ month: monthLabel, count: monthSubs.length, revenue: monthSubs.reduce((s, t) => s + (PRICING[t.plan]?.price || 0), 0) });
        }

        // 15-Day Smooth Comparison Line Chart
        const comparisonData = [];
        for (let i = 14; i >= 0; i--) {
            const currentDate = new Date(now); currentDate.setDate(currentDate.getDate() - i);
            const currentStr = currentDate.toISOString().split("T")[0];
            const currentStart = new Date(currentStr), currentEnd = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);
            const currentSubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= currentStart && d < currentEnd; });
            const currentRevenue = currentSubs.reduce((s, t) => s + (PRICING[t.plan]?.price || 0), 0);

            const previousDate = new Date(currentDate); previousDate.setDate(previousDate.getDate() - 15);
            const previousStr = previousDate.toISOString().split("T")[0];
            const previousStart = new Date(previousStr), previousEnd = new Date(previousStart.getTime() + 24 * 60 * 60 * 1000);
            const previousSubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= previousStart && d < previousEnd; });
            const previousRevenue = previousSubs.reduce((s, t) => s + (PRICING[t.plan]?.price || 0), 0);

            const cumulativeCurrent = currentRevenue + (i < 14 ? (comparisonData[comparisonData.length - 1]?.cumulativeCurrent || 0) - (comparisonData[comparisonData.length - 1]?.currentRevenue || 0) + currentRevenue : currentRevenue);
            const cumulativePrevious = previousRevenue;

            comparisonData.push({
                date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                currentRevenue,
                previousRevenue,
                currentCumulative: comparisonData.length > 0 ? comparisonData[comparisonData.length - 1].currentCumulative + currentRevenue : currentRevenue,
                previousCumulative: comparisonData.length > 0 ? comparisonData[comparisonData.length - 1].previousCumulative + previousRevenue : previousRevenue,
            });
        }

        // Calculate cumulative properly
        let cumCurrent = 0, cumPrevious = 0;
        for (let i = 0; i < comparisonData.length; i++) {
            cumCurrent += comparisonData[i].currentRevenue;
            cumPrevious += comparisonData[i].previousRevenue;
            comparisonData[i].currentCumulative = cumCurrent;
            comparisonData[i].previousCumulative = cumPrevious;
        }

        // Monthly Leaderboard - Revenue per month per tenant
        const monthlyLeaderboard = [];
        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthLabel = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            const monthSubs = activeTenants.filter(t => { const d = new Date(t.created_at); return d >= monthDate && d <= monthEnd; });
            const monthRev = monthSubs.reduce((s, t) => s + (PRICING[t.plan]?.monthlyEquivalent || 0), 0);
            monthlyLeaderboard.push({ month: monthLabel, revenue: monthRev, count: monthSubs.length });
        }

        // Top performing months
        const topMonths = [...monthlyLeaderboard].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

        return {
            totalRevenue, todayRevenue, todayCount: todaySubs.length,
            thisMonthRevenue, thisMonthCount: thisMonthSubs.length,
            lastMonthRevenue, lastMonthCount: lastMonthSubs.length,
            monthlyProjected, growthRate,
            starterCount, proCount, enterpriseCount,
            starterRevenue, proRevenue, enterpriseRevenue,
            activeCount: activeTenants.length,
            dailySubs, monthlySubs, comparisonData,
            monthlyLeaderboard: topMonths,
            allMonthlyLeaderboard: monthlyLeaderboard,
        };
    }, [tenants]);

    const formatCurrency = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
    const formatNumber = (v) => new Intl.NumberFormat("en-US").format(v || 0);

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 size={40} className="text-emerald-500 animate-spin" /></div>;
    if (error) return <div className="bg-white border border-red-200 rounded-3xl p-10 text-center shadow-lg"><AlertTriangle size={48} className="text-red-400 mx-auto mb-4" /><h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3><p className="text-gray-500 mb-4">{error}</p><button onClick={fetchData} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold">Retry</button></div>;

    const a = analytics;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl shadow-green-200"><BarChart3 size={22} className="text-white" /></div>
                    <div><h1 className="text-3xl font-bold text-gray-900">Subscription Analytics</h1><p className="text-sm text-gray-500 mt-1">Revenue & growth metrics · {a.activeCount} active subscriptions</p></div>
                </div>
                <button onClick={fetchData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"><RefreshCw size={16} className="text-gray-500" /></button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: "Total Revenue", value: formatCurrency(a.totalRevenue), sub: `${a.activeCount} active`, icon: Wallet, color: "#10b981", bg: "#ecfdf5" },
                    { label: "Today", value: formatCurrency(a.todayRevenue), sub: `${a.todayCount} new`, icon: DollarSign, color: "#6366f1", bg: "#eef2ff" },
                    { label: "This Month", value: formatCurrency(a.thisMonthRevenue), sub: `${a.thisMonthCount} new`, icon: TrendingUp, color: "#3b82f6", bg: "#eff6ff" },
                    { label: "Last Month", value: formatCurrency(a.lastMonthRevenue), sub: `${a.lastMonthCount} new`, icon: Calendar, color: "#f59e0b", bg: "#fffbeb" },
                    { label: "Growth", value: `${a.growthRate}%`, sub: "Month over month", icon: a.growthRate >= 0 ? ArrowUpRight : ArrowDownRight, color: a.growthRate >= 0 ? "#10b981" : "#ef4444", bg: a.growthRate >= 0 ? "#ecfdf5" : "#fef2f2" },
                    { label: "Projected", value: formatCurrency(a.monthlyProjected), sub: "Monthly recurring", icon: Rocket, color: "#8b5cf6", bg: "#f5f3ff" },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: kpi.color }} />
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: kpi.bg }}><Icon size={18} style={{ color: kpi.color }} /></div>
                                <ArrowUpRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900 font-mono">{kpi.value}</h3>
                            {kpi.sub && <p className="text-[11px] text-gray-400 mt-1">{kpi.sub}</p>}
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Subscription Revenue - Bar Chart */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-emerald-50 rounded-xl"><BarChart3 size={20} className="text-emerald-600" /></div><div><h3 className="font-bold text-gray-900">Daily Subscription Revenue</h3><p className="text-xs text-gray-500">Last 30 days</p></div></div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={a.dailySubs} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <defs><linearGradient id="dailyBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.3} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="revenue" fill="url(#dailyBar)" radius={[8, 8, 0, 0]} barSize={22} name="Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Subscription Revenue - Smooth Line */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 rounded-xl"><TrendingUp size={20} className="text-blue-600" /></div><div><h3 className="font-bold text-gray-900">Monthly Revenue Trend</h3><p className="text-xs text-gray-500">Last 12 months</p></div></div>
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={a.monthlySubs}>
                            <defs><linearGradient id="monRev2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.5} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" fill="url(#monRev2)" stroke="none" />
                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#3b82f6", stroke: "#fff", strokeWidth: 3 }} name="Revenue" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 15-Day Smooth Comparison Chart */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-amber-50 rounded-xl"><Activity size={20} className="text-amber-600" /></div><div><h3 className="font-bold text-gray-900">15-Day Cumulative Comparison</h3><p className="text-xs text-gray-500">Current period vs previous period (smooth tracking)</p></div></div>
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-full bg-emerald-500 shadow-sm" /><span className="text-xs font-medium text-gray-600">Current Period</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-full bg-gray-300 shadow-sm" /><span className="text-xs font-medium text-gray-600">Previous Period</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-full bg-emerald-200 shadow-sm" /><span className="text-xs font-medium text-gray-600">Current Cumulative</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-1.5 rounded-full bg-gray-200 shadow-sm" /><span className="text-xs font-medium text-gray-600">Previous Cumulative</span></div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={a.comparisonData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            <linearGradient id="previousGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d1d5db" stopOpacity={0.2} /><stop offset="100%" stopColor="#d1d5db" stopOpacity={0} /></linearGradient>
                            <linearGradient id="cumCurrentGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.2} /><stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} /></linearGradient>
                            <linearGradient id="cumPreviousGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.15} /><stop offset="100%" stopColor="#e5e7eb" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={1} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Cumulative areas */}
                        <Area type="monotone" dataKey="currentCumulative" fill="url(#cumCurrentGrad)" stroke="#6ee7b7" strokeWidth={1.5} strokeDasharray="6 3" name="Current Cumulative" />
                        <Area type="monotone" dataKey="previousCumulative" fill="url(#cumPreviousGrad)" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="6 3" name="Previous Cumulative" />
                        {/* Daily lines */}
                        <Area type="monotone" dataKey="currentRevenue" fill="url(#currentGrad)" stroke="none" name="Current Daily" />
                        <Area type="monotone" dataKey="previousRevenue" fill="url(#previousGrad)" stroke="none" name="Previous Daily" />
                        <Line type="monotone" dataKey="currentRevenue" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} name="Current Period" />
                        <Line type="monotone" dataKey="previousRevenue" stroke="#d1d5db" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#9ca3af", stroke: "#fff", strokeWidth: 2 }} name="Previous Period" />
                    </ComposedChart>
                </ResponsiveContainer>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {[
                        { label: "Current Total", value: formatCurrency(a.comparisonData[a.comparisonData.length - 1]?.currentCumulative || 0), color: "#10b981" },
                        { label: "Previous Total", value: formatCurrency(a.comparisonData[a.comparisonData.length - 1]?.previousCumulative || 0), color: "#9ca3af" },
                        { label: "Difference", value: formatCurrency((a.comparisonData[a.comparisonData.length - 1]?.currentCumulative || 0) - (a.comparisonData[a.comparisonData.length - 1]?.previousCumulative || 0)), color: "#6366f1" },
                        { label: "Change", value: `${a.growthRate}%`, color: a.growthRate >= 0 ? "#10b981" : "#ef4444" },
                    ].map((s, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Plan Breakdown & Monthly Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan Revenue Breakdown */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-50 rounded-xl"><CreditCard size={20} className="text-purple-600" /></div><div><h3 className="font-bold text-gray-900">Plan Revenue Breakdown</h3><p className="text-xs text-gray-500">By subscription tier</p></div></div>
                    <div className="space-y-4">
                        {[
                            { plan: "Starter", count: a.starterCount, revenue: a.starterRevenue, price: PRICING.starter.price, interval: "mo", monthlyEquiv: PRICING.starter.monthlyEquivalent, color: PRICING.starter.color, icon: PRICING.starter.icon },
                            { plan: "Pro", count: a.proCount, revenue: a.proRevenue, price: PRICING.pro.price, interval: "qtr", monthlyEquiv: PRICING.pro.monthlyEquivalent, color: PRICING.pro.color, icon: PRICING.pro.icon },
                            { plan: "Enterprise", count: a.enterpriseCount, revenue: a.enterpriseRevenue, price: PRICING.enterprise.price, interval: "semi", monthlyEquiv: PRICING.enterprise.monthlyEquivalent, color: PRICING.enterprise.color, icon: PRICING.enterprise.icon },
                        ].map((p, i) => {
                            const Icon = p.icon;
                            const pct = a.totalRevenue > 0 ? ((p.revenue / a.totalRevenue) * 100).toFixed(1) : 0;
                            return (
                                <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${p.color}20` }}><Icon size={18} style={{ color: p.color }} /></div>
                                            <div><p className="text-sm font-bold text-gray-900">{p.plan}</p><p className="text-[11px] text-gray-500">${p.price}/{p.interval} · ${p.monthlyEquiv.toFixed(2)}/mo equiv</p></div>
                                        </div>
                                        <div className="text-right"><p className="text-sm font-bold text-emerald-600">{formatCurrency(p.revenue)}</p><p className="text-[10px] text-gray-400">{p.count} subs</p></div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2"><span>Share of total</span><span className="font-bold" style={{ color: p.color }}>{pct}%</span></div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}cc)` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-emerald-800">Monthly Recurring Projection</span>
                            <span className="text-lg font-bold text-emerald-700">{formatCurrency(a.monthlyProjected)}</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Revenue Leaderboard */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-amber-50 rounded-xl"><Trophy size={20} className="text-amber-600" /></div><div><h3 className="font-bold text-gray-900">Monthly Revenue Leaderboard</h3><p className="text-xs text-gray-500">Top performing months by subscription revenue</p></div></div>
                    <div className="space-y-2">
                        {a.monthlyLeaderboard.map((entry, i) => {
                            const medals = [
                                { icon: Trophy, color: "#f59e0b", bg: "#fef3c7", label: "🥇" },
                                { icon: Medal, color: "#94a3b8", bg: "#f1f5f9", label: "🥈" },
                                { icon: Medal, color: "#d97706", bg: "#fffbeb", label: "🥉" },
                            ];
                            const medal = medals[i] || { icon: Star, color: "#6b7280", bg: "#f3f4f6", label: `#${i + 1}` };
                            const MIcon = medal.icon;
                            const maxRev = a.monthlyLeaderboard[0]?.revenue || 1;
                            const barPct = (entry.revenue / maxRev) * 100;
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: medal.bg }}>
                                        {i < 3 ? <span className="text-lg">{medal.label}</span> : <MIcon size={14} style={{ color: medal.color }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-semibold text-gray-900">{entry.month}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500">{entry.count} subs</span>
                                                <span className="text-sm font-bold text-emerald-600">{formatCurrency(entry.revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(barPct, 2)}%`, background: i < 3 ? `linear-gradient(90deg, #f59e0b, #fbbf24)` : `linear-gradient(90deg, #e5e7eb, #d1d5db)` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {a.monthlyLeaderboard.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Subs", value: a.activeCount, icon: CheckCircle2, color: "#10b981" },
                    { label: "Starter", value: a.starterCount, icon: Zap, color: "#f59e0b" },
                    { label: "Pro", value: a.proCount, icon: Star, color: "#3b82f6" },
                    { label: "Enterprise", value: a.enterpriseCount, icon: Crown, color: "#8b5cf6" },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${s.color}15` }}><Icon size={18} style={{ color: s.color }} /></div>
                            <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.value}</p></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}