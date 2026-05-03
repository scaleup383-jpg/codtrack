"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ProtectedPage from "@/components/ProtectedPage";

import {
    DollarSign,
    CheckCircle2,
    Clock,
    User,
    Package,
    Truck,
    Filter,
    Loader2,
    AlertCircle,
    BadgeCheck,
    Wallet,
    ArrowUpRight,
    Search,
    X,
    RefreshCw,
    RotateCcw,
    AlertTriangle,
    BarChart3,
    TrendingUp,
    PackageCheck,
    PackageX,
    ArrowLeftRight,
    ShoppingBag,
    Hash,
    ChevronDown,
    TrendingDown,
    Activity,
    Layers,
    Target,
    Zap,
    Sparkles,
    PieChart,
    ArrowUp,
    ArrowDown,
    CreditCard,
    Calendar,
    MoreHorizontal,
    Download,
    Sliders,
    GripHorizontal,
} from "lucide-react";

export default function CashflowTrackingPage() {
    // States
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [leads, setLeads] = useState([]);
    const [filteredLeads, setFilteredLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState(null);
    const [showStats, setShowStats] = useState(true);

    // Advanced KPIs
    const [kpis, setKpis] = useState({
        totalDelivered: 0,
        deliveredUnits: 0,
        expectedCash: 0,
        receivedCash: 0,
        pendingCash: 0,
        paidOrders: 0,
        unpaidOrders: 0,

        totalReturned: 0,
        returnedUnits: 0,
        returnAmount: 0,
        inReturnOrders: 0,
        inReturnUnits: 0,
        inReturnAmount: 0,

        netExpected: 0,
        netReceived: 0,
        netPending: 0,
        totalUnits: 0,
        reconciliationRate: 0,
        collectionRate: 0,
    });

    // Fetch user and leads
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const {
                data: { user: authUser },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !authUser) {
                setError("Please sign in to access this page");
                setLoading(false);
                return;
            }

            setUser(authUser);

            const { data: profileData, error: profileError } = await supabase
                .from("user_profiles")
                .select("id, tenant_id, role, full_name")
                .eq("id", authUser.id)
                .single();

            if (profileError || !profileData) {
                setError("User profile not found");
                setLoading(false);
                return;
            }

            setProfile(profileData);

            let query = supabase
                .from("leads")
                .select("*")
                .eq("tenant_id", profileData.tenant_id)
                .in("status", ["delivered", "returned", "in_return"])
                .order("date", { ascending: false });

            if (profileData.role === "agent") {
                query = query.eq("assigned_to", authUser.id);
            }

            const { data: leadsData, error: leadsError } = await query;

            if (leadsError) throw leadsError;

            const allLeads = leadsData || [];
            setLeads(allLeads);

            const deliveredOrders = allLeads.filter(l => l.status === "delivered");
            const returnedOrders = allLeads.filter(l => l.status === "returned");
            const inReturnOrders = allLeads.filter(l => l.status === "in_return");

            const totalDelivered = deliveredOrders.length;
            const deliveredUnits = deliveredOrders.reduce((sum, lead) => sum + (lead.quantity || 1), 0);
            const expectedCash = deliveredOrders.reduce((sum, lead) => sum + (lead.amount || 0), 0);
            const receivedCash = deliveredOrders.filter(l => l.is_paid).reduce((sum, lead) => sum + (lead.amount || 0), 0);
            const pendingCash = expectedCash - receivedCash;
            const paidOrders = deliveredOrders.filter(l => l.is_paid).length;
            const unpaidOrders = deliveredOrders.filter(l => !l.is_paid).length;
            const collectionRate = totalDelivered > 0 ? ((paidOrders / totalDelivered) * 100).toFixed(1) : 0;

            const totalReturned = returnedOrders.length;
            const returnedUnits = returnedOrders.reduce((sum, lead) => sum + (lead.quantity || 1), 0);
            const returnAmount = returnedOrders.reduce((sum, lead) => sum + (lead.amount || 0), 0);

            const inReturnTotal = inReturnOrders.length;
            const inReturnUnits = inReturnOrders.reduce((sum, lead) => sum + (lead.quantity || 1), 0);
            const inReturnAmount = inReturnOrders.reduce((sum, lead) => sum + (lead.amount || 0), 0);

            const totalUnits = deliveredUnits + returnedUnits + inReturnUnits;
            const netExpected = expectedCash - returnAmount - inReturnAmount;
            const netReceived = receivedCash;
            const netPending = netExpected - netReceived;

            setKpis({
                totalDelivered,
                deliveredUnits,
                expectedCash,
                receivedCash,
                pendingCash,
                paidOrders,
                unpaidOrders,

                totalReturned,
                returnedUnits,
                returnAmount,
                inReturnOrders: inReturnTotal,
                inReturnUnits,
                inReturnAmount,

                netExpected,
                netReceived,
                netPending,
                totalUnits,
                reconciliationRate: collectionRate,
                collectionRate,
            });

            applyFilters(allLeads, "all", searchTerm);
        } catch (err) {
            console.error("Error fetching cashflow data:", err);
            setError(err.message || "Failed to load cashflow data");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const applyFilters = (leadsData, filter, search) => {
        let filtered = [...leadsData];

        if (filter === "delivered") {
            filtered = filtered.filter((lead) => lead.status === "delivered");
        } else if (filter === "returned") {
            filtered = filtered.filter((lead) => lead.status === "returned");
        } else if (filter === "in_return") {
            filtered = filtered.filter((lead) => lead.status === "in_return");
        } else if (filter === "paid") {
            filtered = filtered.filter((lead) => lead.is_paid === true);
        } else if (filter === "unpaid") {
            filtered = filtered.filter((lead) => lead.is_paid === false);
        }

        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (lead) =>
                    lead.customer?.toLowerCase().includes(searchLower) ||
                    lead.product?.toLowerCase().includes(searchLower) ||
                    lead.delivery_company?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredLeads(filtered);
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        applyFilters(leads, filter, searchTerm);
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        applyFilters(leads, activeFilter, value);
    };

    const handleMarkPaid = async (leadId) => {
        try {
            setUpdatingId(leadId);

            const { error: updateError } = await supabase
                .from("leads")
                .update({
                    is_paid: true,
                    paid_at: new Date().toISOString(),
                })
                .eq("id", leadId);

            if (updateError) throw updateError;

            const updatedLeads = leads.map((lead) =>
                lead.id === leadId
                    ? { ...lead, is_paid: true, paid_at: new Date().toISOString() }
                    : lead
            );

            setLeads(updatedLeads);
            applyFilters(updatedLeads, activeFilter, searchTerm);

            fetchData();
        } catch (err) {
            console.error("Error marking as paid:", err);
            alert("Failed to mark as paid. Please try again.");
        } finally {
            setUpdatingId(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <ProtectedPage>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
                    <div className="text-center space-y-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-full" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-700 text-lg font-semibold">Loading Cashflow Data</p>
                            <p className="text-gray-500 text-sm">Fetching orders and returns...</p>
                        </div>
                    </div>
                </div>
            </ProtectedPage>
        );
    }

    if (error) {
        return (
            <ProtectedPage>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
                    <div className="bg-white border border-red-200 rounded-3xl p-10 max-w-lg mx-4 text-center shadow-2xl shadow-red-100">
                        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Data</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={fetchData}
                            className="bg-green-600 text-white px-8 py-3 rounded-2xl hover:bg-green-700 transition-all font-semibold shadow-lg shadow-green-200"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </ProtectedPage>
        );
    }

    return (
        <ProtectedPage>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                                        <BarChart3 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">Cashflow & Returns</h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg">
                                                <Activity className="w-3.5 h-3.5 text-green-600" />
                                                <span className="text-xs font-semibold text-green-700">
                                                    {kpis.collectionRate}% Collected
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-lg">
                                                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                                                <span className="text-xs font-semibold text-orange-700">
                                                    {kpis.totalReturned + kpis.inReturnOrders} Returns
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowStats(!showStats)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 rounded-2xl transition-all text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm"
                                >
                                    <Sliders className="w-4 h-4" />
                                    {showStats ? "Hide Stats" : "Show Stats"}
                                </button>
                                <button
                                    onClick={fetchData}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-2xl transition-all text-sm font-semibold text-white shadow-lg shadow-green-200"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Panel */}
                    {showStats && (
                        <>
                            {/* Net Position Card */}
                            <div className="bg-white border border-gray-200 rounded-3xl p-8 mb-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Net Position Summary</h3>
                                        <p className="text-sm text-gray-500">After deducting all returns</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Net Expected */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
                                        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                    <Target className="w-6 h-6 text-green-600" />
                                                </div>
                                                <ArrowUpRight className="w-5 h-5 text-green-400" />
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium mb-1">Net Expected</p>
                                            <p className="text-3xl font-bold text-gray-900 mb-2">
                                                {formatCurrency(kpis.netExpected)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-green-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }} />
                                                </div>
                                                <span className="text-xs text-gray-500">{kpis.totalDelivered + kpis.totalReturned + kpis.inReturnOrders} orders</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Received */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
                                        <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                    <BadgeCheck className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium mb-1">Net Received</p>
                                            <p className="text-3xl font-bold text-emerald-600 mb-2">
                                                {formatCurrency(kpis.netReceived)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kpis.collectionRate}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500">{kpis.paidOrders} paid</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Pending */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
                                        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                    <Clock className="w-6 h-6 text-amber-600" />
                                                </div>
                                                <TrendingDown className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium mb-1">Net Pending</p>
                                            <p className={`text-3xl font-bold mb-2 ${kpis.netPending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(kpis.netPending)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${kpis.netPending > 0 ? (kpis.netPending / kpis.netExpected * 100) : 0}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-500">{kpis.unpaidOrders} unpaid</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reconciliation Rate */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />
                                        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                    <PieChart className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <Sparkles className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium mb-1">Reconciliation</p>
                                            <p className="text-3xl font-bold text-blue-600 mb-2">
                                                {kpis.collectionRate}%
                                            </p>
                                            <div className="relative h-2 bg-blue-100 rounded-full overflow-hidden">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                                                    style={{ width: `${kpis.collectionRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Stats Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Delivered Orders Stats */}
                                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
                                            <PackageCheck className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Delivered Orders</h3>
                                            <p className="text-sm text-gray-500">Cash collection tracking</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-gray-100 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ShoppingBag className="w-4 h-4 text-green-600" />
                                                <span className="text-xs font-semibold text-gray-600">Total Orders</span>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 mb-1">{kpis.totalDelivered}</p>
                                            <p className="text-sm text-gray-500">{kpis.deliveredUnits} units</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-emerald-50 border border-gray-100 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                                <span className="text-xs font-semibold text-gray-600">Expected Cash</span>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(kpis.expectedCash)}</p>
                                            <p className="text-sm text-gray-500">total value</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-teal-50 border border-gray-100 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <BadgeCheck className="w-4 h-4 text-teal-600" />
                                                <span className="text-xs font-semibold text-gray-600">Received Cash</span>
                                            </div>
                                            <p className="text-3xl font-bold text-teal-600 mb-1">{formatCurrency(kpis.receivedCash)}</p>
                                            <p className="text-sm text-gray-500">{kpis.paidOrders} paid orders</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-amber-50 border border-gray-100 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                                <span className="text-xs font-semibold text-gray-600">Pending Cash</span>
                                            </div>
                                            <p className={`text-3xl font-bold mb-1 ${kpis.pendingCash > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                                {formatCurrency(kpis.pendingCash)}
                                            </p>
                                            <p className="text-sm text-gray-500">{kpis.unpaidOrders} unpaid</p>
                                        </div>
                                    </div>

                                    {/* Collection Progress */}
                                    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-700">Collection Progress</span>
                                            <span className="text-sm font-bold text-green-600">{kpis.collectionRate}%</span>
                                        </div>
                                        <div className="relative h-3 bg-white rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700 shadow-lg shadow-green-200"
                                                style={{ width: `${kpis.collectionRate}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 font-medium">
                                            <span>{formatCurrency(kpis.receivedCash)} collected</span>
                                            <span>{formatCurrency(kpis.expectedCash)} expected</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Returns Stats */}
                                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                                            <PackageX className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Returns Tracking</h3>
                                            <p className="text-sm text-gray-500">Product unit return status</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <RotateCcw className="w-4 h-4 text-red-600" />
                                                <span className="text-xs font-semibold text-gray-600">Confirmed Returns</span>
                                            </div>
                                            <p className="text-3xl font-bold text-red-600 mb-3">{kpis.totalReturned}</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Units Returned</span>
                                                    <span className="font-bold text-gray-900">{kpis.returnedUnits}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Return Value</span>
                                                    <span className="font-bold text-red-600">{formatCurrency(kpis.returnAmount)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <ArrowLeftRight className="w-4 h-4 text-orange-600" />
                                                <span className="text-xs font-semibold text-gray-600">In Return Process</span>
                                            </div>
                                            <p className="text-3xl font-bold text-orange-600 mb-3">{kpis.inReturnOrders}</p>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Units in Transit</span>
                                                    <span className="font-bold text-gray-900">{kpis.inReturnUnits}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500">Pending Amount</span>
                                                    <span className="font-bold text-orange-600">{formatCurrency(kpis.inReturnAmount)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unit Distribution */}
                                        <div className="col-span-2 bg-gradient-to-br from-gray-50 to-purple-50 border border-gray-200 rounded-2xl p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-semibold text-gray-700">Unit Distribution</span>
                                                <span className="text-sm font-bold text-gray-900">{kpis.totalUnits} Total Units</span>
                                            </div>

                                            {/* Distribution Bar */}
                                            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                                                <div className="absolute inset-y-0 left-0 flex">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700"
                                                        style={{ width: `${(kpis.deliveredUnits / kpis.totalUnits) * 100}%` }}
                                                    />
                                                    <div
                                                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
                                                        style={{ width: `${(kpis.inReturnUnits / kpis.totalUnits) * 100}%` }}
                                                    />
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                                                        style={{ width: `${(kpis.returnedUnits / kpis.totalUnits) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Legend */}
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" />
                                                    <span className="text-xs font-medium text-gray-600">
                                                        Delivered ({kpis.deliveredUnits})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm" />
                                                    <span className="text-xs font-medium text-gray-600">
                                                        In Return ({kpis.inReturnUnits})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                                                    <span className="text-xs font-medium text-gray-600">
                                                        Returned ({kpis.returnedUnits})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Impact Summary */}
                                        <div className="col-span-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Total Return Impact</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {kpis.returnedUnits + kpis.inReturnUnits} units · {formatCurrency(kpis.returnAmount + kpis.inReturnAmount)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-red-600">
                                                        {kpis.totalUnits > 0
                                                            ? ((kpis.returnedUnits + kpis.inReturnUnits) / kpis.totalUnits * 100).toFixed(1)
                                                            : 0}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">Return Rate</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Filters */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-5 mb-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-2xl">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <span className="text-xs font-semibold text-gray-600">Filters</span>
                                </div>
                                {[
                                    { key: "all", label: "All Orders", icon: ShoppingBag, color: "gray" },
                                    { key: "delivered", label: "Delivered", icon: PackageCheck, color: "green" },
                                    { key: "in_return", label: "In Return", icon: ArrowLeftRight, color: "orange" },
                                    { key: "returned", label: "Returned", icon: RotateCcw, color: "red" },
                                    { key: "paid", label: "Paid", icon: BadgeCheck, color: "emerald" },
                                    { key: "unpaid", label: "Unpaid", icon: Clock, color: "amber" },
                                ].map((filter) => {
                                    const Icon = filter.icon;
                                    const isActive = activeFilter === filter.key;
                                    return (
                                        <button
                                            key={filter.key}
                                            onClick={() => handleFilterChange(filter.key)}
                                            className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all flex items-center gap-2 ${isActive
                                                ? "bg-green-600 text-white shadow-lg shadow-green-200"
                                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative w-full lg:w-72">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by customer, product..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            applyFilters(leads, activeFilter, "");
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                        {filteredLeads.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Package className="w-12 h-12 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    {activeFilter !== "all"
                                        ? `No ${activeFilter.replace('_', ' ')} orders match your current filters.`
                                        : "No orders available. Orders will appear here once they are delivered or returned."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-gray-50 to-green-50 border-b-2 border-gray-100">
                                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Product
                                                </th>
                                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Units
                                                </th>
                                                <th className="text-right px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Delivery
                                                </th>
                                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Payment
                                                </th>
                                                <th className="text-right px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredLeads.map((lead) => (
                                                <tr
                                                    key={lead.id}
                                                    className={`hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30 transition-all duration-200 ${lead.status === "returned" ? "bg-red-50/30" :
                                                        lead.status === "in_return" ? "bg-orange-50/30" : ""
                                                        }`}
                                                >
                                                    {/* Customer */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${lead.status === "returned"
                                                                ? "bg-gradient-to-br from-red-100 to-red-200"
                                                                : lead.status === "in_return"
                                                                    ? "bg-gradient-to-br from-orange-100 to-orange-200"
                                                                    : "bg-gradient-to-br from-green-100 to-green-200"
                                                                }`}>
                                                                <User className={`w-5 h-5 ${lead.status === "returned"
                                                                    ? "text-red-600"
                                                                    : lead.status === "in_return"
                                                                        ? "text-orange-600"
                                                                        : "text-green-600"
                                                                    }`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">
                                                                    {lead.customer || "N/A"}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {lead.date ? formatDate(lead.date) : "No date"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Product */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-700 font-medium">
                                                                {lead.product || "N/A"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Units */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl text-sm font-bold shadow-sm ${lead.status === "returned"
                                                            ? "bg-red-100 text-red-700"
                                                            : lead.status === "in_return"
                                                                ? "bg-orange-100 text-orange-700"
                                                                : "bg-green-100 text-green-700"
                                                            }`}>
                                                            {lead.quantity || 1}
                                                        </span>
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-sm font-bold ${lead.status === "returned"
                                                            ? "text-red-600"
                                                            : lead.status === "in_return"
                                                                ? "text-orange-600"
                                                                : "text-gray-900"
                                                            }`}>
                                                            {formatCurrency(lead.amount || 0)}
                                                        </span>
                                                    </td>

                                                    {/* Delivery Company */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Truck className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                {lead.delivery_company || "N/A"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-6 py-4 text-center">
                                                        {lead.status === "returned" ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                                <RotateCcw className="w-3 h-3" />
                                                                Returned
                                                            </span>
                                                        ) : lead.status === "in_return" ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                                                <ArrowLeftRight className="w-3 h-3" />
                                                                In Return
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Delivered
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Payment Status */}
                                                    <td className="px-6 py-4 text-center">
                                                        {lead.is_paid ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                <BadgeCheck className="w-3 h-3" />
                                                                Paid
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                                <Clock className="w-3 h-3" />
                                                                Unpaid
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Action Button */}
                                                    <td className="px-6 py-4 text-right">
                                                        {!lead.is_paid ? (
                                                            <button
                                                                onClick={() => handleMarkPaid(lead.id)}
                                                                disabled={updatingId === lead.id}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transform hover:scale-105 active:scale-95"
                                                            >
                                                                {updatingId === lead.id ? (
                                                                    <>
                                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                        Updating...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <DollarSign className="w-3.5 h-3.5" />
                                                                        Mark Paid
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className="text-right">
                                                                <p className="text-xs font-semibold text-gray-500">
                                                                    {lead.paid_at ? formatDate(lead.paid_at) : "Reconciled"}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 mt-0.5">Completed</p>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Enhanced Table Footer */}
                                <div className="border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-green-50 px-6 py-5">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-gray-200">
                                                <Layers className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">
                                                    <span className="font-bold text-gray-900">{filteredLeads.length}</span> of {leads.length} orders
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-gray-200">
                                                <Hash className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">
                                                    <span className="font-bold text-gray-900">
                                                        {filteredLeads.reduce((sum, lead) => sum + (lead.quantity || 1), 0)}
                                                    </span> units
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 font-medium mb-0.5">Total Amount</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {formatCurrency(
                                                        filteredLeads.reduce((sum, lead) => sum + (lead.amount || 0), 0)
                                                    )}
                                                </p>
                                            </div>
                                            <div className="w-px h-10 bg-gray-200" />
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 font-medium mb-0.5">Paid Amount</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatCurrency(
                                                        filteredLeads
                                                            .filter(l => l.is_paid)
                                                            .reduce((sum, lead) => sum + (lead.amount || 0), 0)
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedPage>
    );
}