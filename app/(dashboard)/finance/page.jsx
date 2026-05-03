"use client";

import ProtectedPage from "@/components/ProtectedPage";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    DollarSign, TrendingUp, TrendingDown, RefreshCw, Plus, X,
    Loader2, ArrowUp, ArrowDown, PieChart, BarChart3, Activity,
    ShoppingCart, Package, CreditCard, Receipt, Wallet, Target,
    Zap, ChevronDown, Filter, Calendar, Download, Upload, Search,
    AlertTriangle, CheckCircle, Info, FileText, Trash2, Edit,
    Eye, ArrowUpDown, SlidersHorizontal, MoreVertical, Layers,
    Sparkles, Star, Award, TrendingUpIcon, ChevronRight,
    ChevronLeft, Maximize2, Minimize2, Users
} from "lucide-react";

/* ================================================================
   TYPES & CONSTANTS
================================================================ */
const EXPENSE_TYPES = [
    { value: "ads", label: "Advertising", icon: Target, color: "#22c55e", bgColor: "#f0fdf4" },
    { value: "tools", label: "Tools & Software", icon: Zap, color: "#16a34a", bgColor: "#dcfce7" },
    { value: "office", label: "Office", icon: Package, color: "#15803d", bgColor: "#bbf7d0" },
    { value: "misc", label: "Miscellaneous", icon: MoreVertical, color: "#166534", bgColor: "#86efac" },
];

const PERIODS = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "12m", label: "12 Months" },
    { value: "all", label: "All Time" },
];

/* ================================================================
   TOAST SYSTEM
================================================================ */
function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = useCallback((msg, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    }, []);
    return { toasts, add };
}

/* ================================================================
   BUSINESS LOGIC - Pure calculation function (NOT in JSX)
================================================================ */
function calculateFinanceData(leads, products, expenses) {
    // 1. REVENUE: sum of delivered leads amount
    const deliveredLeads = leads.filter(l => l.status === "delivered");
    const revenue = deliveredLeads.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

    // 2. COGS: sum(products.buy_price * leads.quantity) joined by SKU
    let cogs = 0;
    const cogsDetails = [];
    const cogsByProduct = {};

    for (const lead of deliveredLeads) {
        const product = products.find(p => p.sku === lead.product_sku);
        if (product && lead.product_sku) {
            const cost = (parseFloat(product.buy_price) || 0) * (parseInt(lead.quantity) || 1);
            cogs += cost;

            const key = lead.product_sku;
            if (!cogsByProduct[key]) {
                cogsByProduct[key] = { sku: key, quantity: 0, totalCost: 0, buyPrice: parseFloat(product.buy_price) || 0, productName: product.name || key };
            }
            cogsByProduct[key].quantity += parseInt(lead.quantity) || 1;
            cogsByProduct[key].totalCost += cost;

            cogsDetails.push({
                sku: lead.product_sku,
                quantity: parseInt(lead.quantity) || 1,
                buyPrice: parseFloat(product.buy_price) || 0,
                cost,
                productName: product.name || lead.product_sku,
            });
        }
    }

    // 3. GROSS PROFIT
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100) : 0;

    // 4. EXPENSES
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Expenses by type
    const expensesByType = {};
    for (const expense of expenses) {
        const type = expense.type || "misc";
        expensesByType[type] = (expensesByType[type] || 0) + (parseFloat(expense.amount) || 0);
    }

    // Sort expense types by amount
    const sortedExpenseTypes = Object.entries(expensesByType)
        .sort(([, a], [, b]) => b - a)
        .map(([type, amount]) => ({ type, amount }));

    // 5. NET PROFIT
    const netProfit = grossProfit - totalExpenses;
    const netMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;

    // Per-unit metrics
    const totalDelivered = deliveredLeads.length;
    const avgOrderValue = totalDelivered > 0 ? revenue / totalDelivered : 0;
    const avgCOGS = totalDelivered > 0 ? cogs / totalDelivered : 0;
    const avgProfitPerOrder = totalDelivered > 0 ? grossProfit / totalDelivered : 0;

    // Monthly trend data for charts
    const monthlyData = {};
    for (const lead of leads) {
        if (lead.date) {
            const month = new Date(lead.date).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { month, revenue: 0, expenses: 0, count: 0 };
            }
            if (lead.status === "delivered") {
                monthlyData[month].revenue += parseFloat(lead.amount) || 0;
                monthlyData[month].count += 1;
            }
        }
    }

    for (const expense of expenses) {
        if (expense.created_at) {
            const month = new Date(expense.created_at).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { month, revenue: 0, expenses: 0, count: 0 };
            }
            monthlyData[month].expenses += parseFloat(expense.amount) || 0;
        }
    }

    const monthlyTrend = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(m => ({
            ...m,
            profit: m.revenue - m.expenses,
            margin: m.revenue > 0 ? ((m.revenue - m.expenses) / m.revenue * 100) : 0,
        }));

    // Status breakdown
    const statusBreakdown = {};
    for (const lead of leads) {
        statusBreakdown[lead.status || "unknown"] = (statusBreakdown[lead.status || "unknown"] || 0) + 1;
    }

    // Delivery rate
    const deliveryRate = leads.length > 0 ? ((totalDelivered / leads.length) * 100) : 0;

    return {
        revenue, cogs, grossProfit, grossMargin,
        totalExpenses, expensesByType, sortedExpenseTypes,
        netProfit, netMargin,
        totalDelivered, totalLeads: leads.length, totalExpensesCount: expenses.length,
        avgOrderValue, avgCOGS, avgProfitPerOrder,
        cogsDetails, cogsByProduct: Object.values(cogsByProduct),
        deliveredLeads, monthlyTrend, statusBreakdown, deliveryRate,
    };
}

/* ================================================================
   KPI CARD COMPONENT
================================================================ */
function KpiCard({ label, value, sub, icon: Icon, trend, trendVal, color, bgColor, borderColor, isCurrency }) {
    const displayValue = isCurrency
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
        : typeof value === "number" ? value.toLocaleString() : value;

    const isPositive = trend === "up";

    return (
        <div className={`relative bg-white rounded-2xl border-2 overflow-hidden group transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${borderColor}`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r" style={{
                backgroundImage: `linear-gradient(to right, ${color}, ${color}88)`
            }} />
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300" style={{ backgroundColor: bgColor }}>
                        <Icon size={18} style={{ color }} />
                    </div>
                    {trendVal != null && (
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            }`}>
                            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                            {trendVal}%
                        </div>
                    )}
                </div>
                <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-2">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 font-mono tracking-tight">{displayValue}</h3>
                {sub && <p className="text-[11px] text-gray-400 mt-2 font-medium">{sub}</p>}
            </div>
        </div>
    );
}

/* ================================================================
   MAIN CONTENT COMPONENT (renamed from FinanceDashboard)
================================================================ */
function FinanceDashboardContent() {
    const { toasts, add: toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [tenantId, setTenantId] = useState(null);
    const [user, setUser] = useState(null);
    const [sessionReady, setSessionReady] = useState(false);

    // Data
    const [leads, setLeads] = useState([]);
    const [products, setProducts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [tableError, setTableError] = useState(null);

    // UI
    const [period, setPeriod] = useState("30d");
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showExpenseManager, setShowExpenseManager] = useState(false);
    const [expandedSection, setExpandedSection] = useState(null);

    // Expense form
    const [expenseForm, setExpenseForm] = useState({
        type: "ads", amount: "", description: "", date: new Date().toISOString().split("T")[0],
    });
    const [expenseLoading, setExpenseLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    /* ── SESSION INIT ─────────────────────────────── */
    useEffect(() => {
        let isMounted = true;
        async function init() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    setUser(session.user);
                    const { data: profile } = await supabase
                        .from("user_profiles")
                        .select("tenant_id")
                        .eq("id", session.user.id)
                        .single();
                    if (profile?.tenant_id) setTenantId(profile.tenant_id);
                }
                if (isMounted) setSessionReady(true);
            } catch {
                if (isMounted) setSessionReady(true);
            }
        }
        init();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user && isMounted) {
                setUser(session.user);
                const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("id", session.user.id).single();
                if (profile?.tenant_id) setTenantId(profile.tenant_id);
            }
            if (isMounted) setSessionReady(true);
        });
        return () => { isMounted = false; subscription?.unsubscribe(); };
    }, []);

    /* ── BUILD QUERY DATE FILTER ───────────────────── */
    const getDateFilter = useCallback(() => {
        const now = new Date();
        switch (period) {
            case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            case "90d": return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
            case "12m": return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
            default: return null;
        }
    }, [period]);

    /* ── FETCH ALL DATA ────────────────────────────── */
    const fetchAllData = useCallback(async (silent = false) => {
        if (!tenantId) return;
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            setError(null);
            setTableError(null);

            const dateFilter = getDateFilter();
            let leadsQuery = supabase.from("leads").select("*").eq("tenant_id", tenantId).order("date", { ascending: false });
            if (dateFilter) leadsQuery = leadsQuery.gte("date", dateFilter);

            const [leadsRes, productsRes] = await Promise.all([
                leadsQuery,
                supabase.from("products").select("*").eq("tenant_id", tenantId),
            ]);

            if (leadsRes.error) throw leadsRes.error;
            if (productsRes.error) throw productsRes.error;
            setLeads(leadsRes.data || []);
            setProducts(productsRes.data || []);

            let expensesData = [];
            try {
                let expensesQuery = supabase.from("expenses").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
                if (dateFilter) expensesQuery = expensesQuery.gte("created_at", dateFilter);
                const expensesRes = await expensesQuery;
                if (expensesRes.error) {
                    if (expensesRes.error.code === "42P01" || expensesRes.error.message?.includes("does not exist")) {
                        setTableError("expenses");
                    }
                } else {
                    expensesData = expensesRes.data || [];
                }
            } catch { setTableError("expenses"); }
            setExpenses(expensesData);
        } catch (err) {
            console.error("Failed to fetch finance data:", err);
            toast("Failed to load data: " + err.message, "error");
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tenantId, getDateFilter, toast]);

    useEffect(() => {
        if (tenantId && sessionReady) fetchAllData();
    }, [fetchAllData, tenantId, sessionReady]);

    /* ── COMPUTED FINANCE DATA ──────────────────────── */
    const financeData = useMemo(() => calculateFinanceData(leads, products, expenses), [leads, products, expenses]);

    /* ── ADD EXPENSE ────────────────────────────────── */
    const handleAddExpense = async () => {
        if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return toast("Please enter a valid amount", "error");
        if (!tenantId) return toast("Please log in again", "error");
        setExpenseLoading(true);
        try {
            const { error } = await supabase.from("expenses").insert({
                tenant_id: tenantId, type: expenseForm.type, amount: parseFloat(expenseForm.amount),
                description: expenseForm.description || null,
                created_at: expenseForm.date ? new Date(expenseForm.date).toISOString() : new Date().toISOString(),
            });
            if (error) {
                if (error.code === "42P01") throw new Error("Expenses table doesn't exist. Please create it first.");
                throw error;
            }
            toast("Expense added successfully!");
            setShowAddExpense(false);
            setExpenseForm({ type: "ads", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
            fetchAllData(true);
        } catch (err) {
            toast("Failed to add expense: " + err.message, "error");
        } finally { setExpenseLoading(false); }
    };

    /* ── DELETE EXPENSE ─────────────────────────────── */
    const handleDeleteExpense = async (id) => {
        try {
            const { error } = await supabase.from("expenses").delete().eq("id", id);
            if (error) throw error;
            toast("Expense deleted!");
            fetchAllData(true);
        } catch (err) { toast("Failed to delete expense: " + err.message, "error"); }
    };

    /* ── FORMAT HELPERS ─────────────────────────────── */
    const fmt = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    const pct = (val) => `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
    const getExpenseInfo = (type) => EXPENSE_TYPES.find(t => t.value === type) || EXPENSE_TYPES[3];

    if (!mounted) return null;
    if (!sessionReady) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <Loader2 size={32} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8faf8] via-white to-[#f0fdf4]">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* ───── HEADER ───── */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl shadow-lg shadow-green-200">
                            <Layers size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Finance Dashboard</h1>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span>Profit & Loss Overview</span>
                                {financeData.monthlyTrend.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                        {financeData.monthlyTrend.length} months tracked
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Period Selector */}
                        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => setPeriod(p.value)}
                                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${period === p.value
                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => fetchAllData(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
                        >
                            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                        </button>

                        <button
                            onClick={() => setShowAddExpense(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold transition-all shadow-lg shadow-rose-200"
                        >
                            <Plus size={15} />
                            Add Expense
                        </button>
                    </div>
                </div>

                {/* ───── TABLE ERROR BANNER ───── */}
                {tableError === "expenses" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <Info size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-700">Expenses table not found</p>
                            <p className="text-xs text-amber-600 mt-1">
                                Run the migration SQL to create the expenses table. Expenses will show as $0 until created.
                            </p>
                        </div>
                        <button onClick={() => setTableError(null)} className="text-amber-400 hover:text-amber-600">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* ───── ERROR BANNER ───── */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-rose-700">Error</p>
                            <p className="text-sm text-rose-600">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><X size={16} /></button>
                    </div>
                )}

                {/* ───── MAIN KPI CARDS ───── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                                    <div className="w-12 h-4 bg-gray-200 rounded-full" />
                                </div>
                                <div className="w-20 h-3 bg-gray-200 rounded mb-2" />
                                <div className="w-32 h-7 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Revenue" value={financeData.revenue}
                            sub={`${financeData.totalDelivered} delivered orders`}
                            icon={DollarSign} color="#059669" bgColor="#ecfdf5" borderColor="border-emerald-100"
                            trend={financeData.revenue > 0 ? "up" : "down"} trendVal={financeData.totalDelivered > 0 ? financeData.deliveryRate.toFixed(0) : null}
                            isCurrency
                        />
                        <KpiCard
                            label="COGS" value={financeData.cogs}
                            sub={`Avg ${fmt(financeData.avgCOGS)} / order`}
                            icon={ShoppingCart} color="#d97706" bgColor="#fffbeb" borderColor="border-amber-100"
                            trend="up" trendVal={null} isCurrency
                        />
                        <KpiCard
                            label="Gross Profit" value={financeData.grossProfit}
                            sub={`Margin: ${pct(financeData.grossMargin)}`}
                            icon={TrendingUp} color="#2563eb" bgColor="#eff6ff" borderColor="border-blue-100"
                            trend={financeData.grossProfit >= 0 ? "up" : "down"} trendVal={financeData.grossMargin}
                            isCurrency
                        />
                        <KpiCard
                            label="Net Profit" value={financeData.netProfit}
                            sub={`Margin: ${pct(financeData.netMargin)}`}
                            icon={Wallet} color={financeData.netProfit >= 0 ? "#059669" : "#e11d48"}
                            bgColor={financeData.netProfit >= 0 ? "#ecfdf5" : "#fff1f2"}
                            borderColor={financeData.netProfit >= 0 ? "border-emerald-200" : "border-rose-200"}
                            trend={financeData.netProfit >= 0 ? "up" : "down"} trendVal={financeData.netMargin}
                            isCurrency
                        />
                    </div>
                )}

                {/* ───── SECONDARY METRICS ───── */}
                {!loading && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { label: "Total Leads", value: financeData.totalLeads, color: "#6b7280", icon: Users },
                            { label: "Delivered", value: financeData.totalDelivered, color: "#059669", icon: CheckCircle },
                            { label: "Avg Order Value", value: fmt(financeData.avgOrderValue), color: "#2563eb", icon: Star },
                            { label: "Avg Profit/Order", value: fmt(financeData.avgProfitPerOrder), color: "#7c3aed", icon: Award },
                            { label: "Total Expenses", value: fmt(financeData.totalExpenses), color: "#e11d48", icon: Receipt },
                        ].map((metric, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow group">
                                <div className="flex items-center gap-2 mb-2">
                                    <metric.icon size={14} style={{ color: metric.color }} />
                                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{metric.label}</p>
                                </div>
                                <p className="text-lg font-bold text-gray-900 font-mono">{metric.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ───── P&L STATEMENT & EXPENSE CHART ───── */}
                {!loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Profit & Loss Statement */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                                        <FileText size={15} className="text-emerald-600" />
                                    </div>
                                    Profit & Loss Statement
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {/* Revenue */}
                                <div className="flex items-center justify-between py-3 px-4 bg-gray-50/50 rounded-xl">
                                    <span className="text-sm text-gray-600">Revenue</span>
                                    <span className="text-sm font-bold text-gray-900 font-mono">{fmt(financeData.revenue)}</span>
                                </div>

                                {/* COGS */}
                                <div className="flex items-center justify-between py-3 px-4 bg-amber-50/30 rounded-xl">
                                    <div>
                                        <span className="text-sm text-gray-600">COGS</span>
                                        <span className="text-[10px] text-gray-400 ml-2">({financeData.cogsDetails.length} items)</span>
                                    </div>
                                    <span className="text-sm font-semibold text-amber-600 font-mono">-{fmt(financeData.cogs)}</span>
                                </div>

                                {/* Gross Profit */}
                                <div className="flex items-center justify-between py-3 px-4 bg-blue-50/30 rounded-xl border border-blue-100">
                                    <span className="text-sm font-semibold text-gray-700">Gross Profit</span>
                                    <span className="text-sm font-bold text-blue-600 font-mono">
                                        {fmt(financeData.grossProfit)}
                                        <span className="text-xs ml-1.5">({pct(financeData.grossMargin)})</span>
                                    </span>
                                </div>

                                {/* Expenses */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between px-4">
                                        <span className="text-sm text-gray-500">Expenses</span>
                                        <span className="text-xs text-gray-400">{financeData.totalExpensesCount} items</span>
                                    </div>
                                    {financeData.sortedExpenseTypes.map(({ type, amount }) => {
                                        const info = getExpenseInfo(type);
                                        const pct = financeData.revenue > 0 ? ((amount / financeData.revenue) * 100) : 0;
                                        return (
                                            <div key={type} className="flex items-center justify-between py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                                                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                                                    <span className="text-[10px] text-gray-400">({pct.toFixed(1)}%)</span>
                                                </div>
                                                <span className="text-sm text-gray-500 font-mono">-{fmt(amount)}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-rose-50/50 border border-rose-100">
                                        <span className="text-sm font-semibold text-gray-700">Total Expenses</span>
                                        <span className="text-sm font-bold text-rose-600 font-mono">-{fmt(financeData.totalExpenses)}</span>
                                    </div>
                                </div>

                                {/* Net Profit */}
                                <div className={`flex items-center justify-between py-4 px-5 rounded-xl font-bold ${financeData.netProfit >= 0
                                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
                                    : "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200"
                                    }`}>
                                    <span className={financeData.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}>
                                        Net Profit
                                    </span>
                                    <span className={`text-lg font-mono ${financeData.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                                        }`}>
                                        {fmt(financeData.netProfit)}
                                        <span className="text-sm ml-1">({pct(financeData.netMargin)})</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expense Breakdown Chart */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                                        <PieChart size={15} className="text-emerald-600" />
                                    </div>
                                    Expense Breakdown
                                </h3>
                                <button
                                    onClick={() => setShowExpenseManager(true)}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                                >
                                    Manage All
                                </button>
                            </div>
                            <div className="p-6">
                                {financeData.totalExpenses === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="p-3 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
                                            <Receipt size={28} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">No expenses recorded yet</p>
                                        <p className="text-xs text-gray-400 mt-1">Add expenses to see the breakdown</p>
                                        <button
                                            onClick={() => setShowAddExpense(true)}
                                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-200"
                                        >
                                            <Plus size={14} /> Add Expense
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {financeData.sortedExpenseTypes.map(({ type, amount }) => {
                                            const info = getExpenseInfo(type);
                                            const percentage = financeData.totalExpenses > 0 ? (amount / financeData.totalExpenses) * 100 : 0;
                                            return (
                                                <div key={type} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: info.color }} />
                                                            <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-gray-600 font-mono">{fmt(amount)}</span>
                                                            <span className="text-xs text-gray-400 font-semibold w-10 text-right">{percentage.toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                                                            style={{
                                                                width: `${Math.max(percentage, 2)}%`,
                                                                backgroundColor: info.color,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-800">Total Expenses</span>
                                            <span className="text-base font-bold text-rose-600 font-mono">{fmt(financeData.totalExpenses)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── MONTHLY TREND ───── */}
                {!loading && financeData.monthlyTrend.length > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 rounded-lg">
                                    <BarChart3 size={15} className="text-emerald-600" />
                                </div>
                                Monthly Trend
                            </h3>
                            <span className="text-xs text-gray-400">{financeData.monthlyTrend.length} months</span>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {financeData.monthlyTrend.map((month) => (
                                    <div key={month.month} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {new Date(month.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-emerald-600 font-semibold">{fmt(month.revenue)}</span>
                                                <span className={`text-xs font-semibold ${month.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {fmt(month.profit)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 h-2">
                                            <div className="flex-1 bg-emerald-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${Math.min((month.revenue / (financeData.revenue || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex-1 bg-rose-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-rose-400 rounded-full"
                                                    style={{ width: `${Math.min((month.expenses / (financeData.totalExpenses || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-gray-400">
                                            <span>Revenue: {((month.revenue / (financeData.revenue || 1)) * 100).toFixed(0)}%</span>
                                            <span>Expenses: {((month.expenses / (financeData.totalExpenses || 1)) * 100).toFixed(0)}%</span>
                                            <span className="ml-auto">Orders: {month.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── COGS BREAKDOWN ───── */}
                {!loading && financeData.cogsByProduct.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 rounded-lg">
                                    <Package size={15} className="text-amber-600" />
                                </div>
                                COGS by Product
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                                        <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Qty Sold</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Buy Price</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">% of COGS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {financeData.cogsByProduct.sort((a, b) => b.totalCost - a.totalCost).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{item.productName}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-500 font-mono">{item.sku}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-700 text-center">{item.quantity}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-600 text-right font-mono">{fmt(item.buyPrice)}</td>
                                            <td className="px-6 py-3.5 text-sm text-amber-600 text-right font-mono font-semibold">{fmt(item.totalCost)}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-500 text-right">
                                                {financeData.cogs > 0 ? ((item.totalCost / financeData.cogs) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50/50 font-semibold">
                                        <td colSpan={4} className="px-6 py-3 text-sm text-gray-700 text-right">Total COGS</td>
                                        <td className="px-6 py-3 text-sm text-amber-600 text-right font-mono font-bold">{fmt(financeData.cogs)}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500 text-right">100%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ───── ADD EXPENSE MODAL ───── */}
            {showAddExpense && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddExpense(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 rounded-xl">
                                    <Receipt size={18} className="text-rose-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Add Expense</h3>
                            </div>
                            <button onClick={() => setShowAddExpense(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {EXPENSE_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setExpenseForm(p => ({ ...p, type: t.value }))}
                                            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${expenseForm.type === t.value
                                                ? "text-white shadow-md"
                                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                            style={expenseForm.type === t.value ? { backgroundColor: t.color } : {}}
                                        >
                                            <t.icon size={14} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Amount *</label>
                                <div className="relative">
                                    <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number" placeholder="0.00"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Date</label>
                                <input
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={(e) => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Description</label>
                                <textarea
                                    placeholder="Optional note..." rows={2}
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                            <button
                                onClick={() => setShowAddExpense(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddExpense}
                                disabled={expenseLoading}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-200"
                            >
                                {expenseLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Add Expense
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ───── EXPENSE MANAGER MODAL ───── */}
            {showExpenseManager && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowExpenseManager(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-xl">
                                    <Receipt size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Manage Expenses</h3>
                                    <p className="text-xs text-gray-500">{expenses.length} total expenses</p>
                                </div>
                            </div>
                            <button onClick={() => setShowExpenseManager(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {expenses.length === 0 ? (
                                <div className="text-center py-16">
                                    <Receipt size={32} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No expenses yet</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 sticky top-0">
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Description</th>
                                            <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {expenses.map((exp) => {
                                            const info = getExpenseInfo(exp.type);
                                            return (
                                                <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                                                            <span className="text-sm text-gray-700 font-medium capitalize">{exp.type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-sm text-gray-500 max-w-[250px] truncate">
                                                        {exp.description || "—"}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-sm text-rose-600 text-right font-mono font-semibold">
                                                        {fmt(exp.amount)}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-sm text-gray-500">
                                                        {new Date(exp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <button
                                                            onClick={() => handleDeleteExpense(exp.id)}
                                                            className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ───── TOASTS ───── */}
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`fixed bottom-6 right-6 z-[999] pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl border animate-slide-up backdrop-blur-sm ${t.type === "success"
                        ? "bg-white border-emerald-200 text-emerald-700"
                        : t.type === "error"
                            ? "bg-white border-rose-200 text-rose-700"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                >
                    <div className={`p-1.5 rounded-lg ${t.type === "success" ? "bg-emerald-100" : "bg-rose-100"}`}>
                        {t.type === "success" ? <CheckCircle size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-rose-600" />}
                    </div>
                    <span className="flex-1">{t.msg}</span>
                </div>
            ))}

            {/* ───── GLOBAL STYLES ───── */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scaleIn 0.2s ease-out; }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                }
            `}</style>
        </div>
    );
}

/* ================================================================
   PROTECTED PAGE WRAPPER
================================================================ */
export default function FinanceDashboard() {
    return (
        <ProtectedPage page="finance">
            <FinanceDashboardContent />
        </ProtectedPage>
    );
}