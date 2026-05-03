"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import {
    CreditCard, Loader2, Building2, CheckCircle2, XCircle,
    Search, RefreshCw, AlertTriangle, Crown,
    Zap, Calendar, TrendingUp, Ban
} from "lucide-react";

export default function AdminSubscriptionsPage() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [datePickerId, setDatePickerId] = useState(null);
    const [datePickerValue, setDatePickerValue] = useState("");

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => { fetchTenants(); }, []);

    const fetchTenants = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Fetch error:", error);
                showToast("Failed to fetch: " + error.message, "error");
                return;
            }

            console.log("Fetched tenants:", data?.length || 0);
            setTenants(data || []);
        } catch (err) {
            console.error("Error:", err);
            showToast("Failed to load tenants", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const isTenantActive = (tenant) => {
        if (!tenant) return false;
        if (tenant.plan === "disabled") return false;
        if (tenant.subscription_ends_at) {
            return new Date(tenant.subscription_ends_at) > new Date();
        }
        return ["starter", "pro", "enterprise"].includes(tenant.plan);
    };

    const updateTenantPlan = async (id, plan) => {
        try {
            setUpdatingId(id);

            const updates = { plan: plan };

            if (plan !== "disabled") {
                updates.subscription_ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            }

            console.log("Updating plan:", id, "→", plan);

            const { data, error } = await supabase
                .from("tenants")
                .update(updates)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Update error:", error);
                showToast("Failed: " + error.message, "error");
                return;
            }

            console.log("Update success:", data);

            setTenants(prev =>
                prev.map(t => t.id === id ? { ...t, ...updates } : t)
            );

            showToast(plan === "disabled" ? "Tenant disabled!" : `Plan changed to ${plan}!`, "success");
        } catch (err) {
            console.error("Update error:", err);
            showToast("Error: " + err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleTenantStatus = async (id) => {
        try {
            setUpdatingId(id);

            const tenant = tenants.find(t => t.id === id);
            if (!tenant) {
                showToast("Tenant not found", "error");
                return;
            }

            const isDisabled = tenant.plan === "disabled";
            const newPlan = isDisabled ? "starter" : "disabled";

            const updates = { plan: newPlan };

            if (newPlan !== "disabled") {
                updates.subscription_ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            }

            console.log("Toggling:", id, "→", newPlan);

            const { data, error } = await supabase
                .from("tenants")
                .update(updates)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Toggle error:", error);

                // If error, try without subscription_ends_at
                if (error.code === "42501" || error.message?.includes("policy")) {
                    const { error: retryError } = await supabase
                        .from("tenants")
                        .update({ plan: newPlan })
                        .eq("id", id);

                    if (retryError) {
                        showToast("Permission denied. Check RLS.", "error");
                    } else {
                        setTenants(prev =>
                            prev.map(t => t.id === id ? { ...t, plan: newPlan } : t)
                        );
                        showToast(isDisabled ? "Enabled!" : "Disabled!", "success");
                    }
                } else {
                    showToast("Failed: " + error.message, "error");
                }
                return;
            }

            console.log("Toggle success:", data);

            setTenants(prev =>
                prev.map(t => t.id === id ? { ...t, ...updates } : t)
            );

            showToast(isDisabled ? "Enabled!" : "Disabled!", "success");
        } catch (err) {
            console.error("Toggle error:", err);
            showToast("Error: " + err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const extendSubscription = async (id, days) => {
        try {
            setUpdatingId(id);

            const newDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

            console.log("Extending:", id, "by", days, "days");

            const updates = { subscription_ends_at: newDate };

            // Also enable if disabled
            const tenant = tenants.find(t => t.id === id);
            if (tenant?.plan === "disabled") {
                updates.plan = "starter";
            }

            const { data, error } = await supabase
                .from("tenants")
                .update(updates)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Extension error:", error);
                showToast("Failed: " + error.message, "error");
                return;
            }

            console.log("Extension success:", data);

            setTenants(prev =>
                prev.map(t => t.id === id ? { ...t, ...updates } : t)
            );

            showToast(`Extended by ${days} days!`, "success");
        } catch (err) {
            console.error("Extension error:", err);
            showToast("Error: " + err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const updateSubscriptionDate = async (id, dateStr) => {
        try {
            setUpdatingId(id);

            const newDate = new Date(dateStr).toISOString();

            console.log("Updating date:", id, "→", newDate);

            const updates = { subscription_ends_at: newDate };

            // If setting future date, also enable if disabled
            const tenant = tenants.find(t => t.id === id);
            if (tenant?.plan === "disabled" && new Date(newDate) > new Date()) {
                updates.plan = "starter";
            }

            const { data, error } = await supabase
                .from("tenants")
                .update(updates)
                .eq("id", id)
                .select();

            if (error) {
                console.error("Date error:", error);
                showToast("Failed: " + error.message, "error");
                return;
            }

            console.log("Date update success:", data);

            setTenants(prev =>
                prev.map(t => t.id === id ? { ...t, ...updates } : t)
            );

            setDatePickerId(null);
            showToast("Subscription date updated!", "success");
        } catch (err) {
            console.error("Date error:", err);
            showToast("Error: " + err.message, "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const openDatePicker = (id, currentDate) => {
        setDatePickerId(id);
        const d = currentDate ? new Date(currentDate) : new Date();
        setDatePickerValue(d.toISOString().slice(0, 16));
    };

    const filteredTenants = useMemo(() => {
        let result = [...tenants];

        if (search) {
            const s = search.toLowerCase();
            result = result.filter(t =>
                (t.name || "").toLowerCase().includes(s) ||
                (t.plan || "").toLowerCase().includes(s)
            );
        }

        if (filter === "active") result = result.filter(t => isTenantActive(t));
        else if (filter === "disabled") result = result.filter(t => t.plan === "disabled");
        else if (filter === "starter") result = result.filter(t => t.plan === "starter");
        else if (filter === "pro") result = result.filter(t => t.plan === "pro");
        else if (filter === "enterprise") result = result.filter(t => t.plan === "enterprise");

        return result;
    }, [tenants, search, filter]);

    const stats = useMemo(() => ({
        total: tenants.length,
        active: tenants.filter(t => isTenantActive(t)).length,
        disabled: tenants.filter(t => t.plan === "disabled").length,
        starter: tenants.filter(t => t.plan === "starter").length,
        pro: tenants.filter(t => t.plan === "pro").length,
        enterprise: tenants.filter(t => t.plan === "enterprise").length,
    }), [tenants]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={40} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-3 animate-slide-up ${toast.type === "success"
                        ? "bg-white border-emerald-200 text-emerald-700"
                        : "bg-white border-red-200 text-red-700"
                    }`}>
                    {toast.type === "success" ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                        <AlertTriangle size={16} className="text-red-500" />
                    )}
                    {toast.message}
                </div>
            )}

            {/* Date Picker Modal */}
            {datePickerId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDatePickerId(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Set Subscription End Date</h3>

                        {/* Quick Select Buttons */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { label: "+7d", days: 7 },
                                { label: "+30d", days: 30 },
                                { label: "+90d", days: 90 },
                                { label: "+1y", days: 365 },
                            ].map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => {
                                        const d = new Date(Date.now() + opt.days * 24 * 60 * 60 * 1000);
                                        setDatePickerValue(d.toISOString().slice(0, 16));
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <input
                            type="datetime-local"
                            value={datePickerValue}
                            onChange={(e) => setDatePickerValue(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDatePickerId(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => updateSubscriptionDate(datePickerId, datePickerValue)}
                                disabled={updatingId === datePickerId}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                            >
                                {updatingId === datePickerId ? (
                                    <Loader2 size={14} className="animate-spin mx-auto" />
                                ) : (
                                    "Save Date"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl shadow-green-200">
                        <CreditCard size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage tenant plans & billing</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchTenants(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
                >
                    <RefreshCw size={15} className={refreshing ? "animate-spin text-emerald-500" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: "Total", value: stats.total, icon: Building2, color: "#6366f1" },
                    { label: "Active", value: stats.active, icon: CheckCircle2, color: "#10b981" },
                    { label: "Disabled", value: stats.disabled, icon: Ban, color: "#ef4444" },
                    { label: "Starter", value: stats.starter, icon: Zap, color: "#f59e0b" },
                    { label: "Pro", value: stats.pro, icon: TrendingUp, color: "#3b82f6" },
                    { label: "Enterprise", value: stats.enterprise, icon: Crown, color: "#8b5cf6" },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                                <s.icon size={14} style={{ color: s.color }} />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <XCircle size={14} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-gray-200 flex-wrap">
                    {["all", "active", "disabled", "starter", "pro", "enterprise"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <th className="text-left px-5 py-4 text-[11px] font-bold text-gray-500 uppercase">Tenant</th>
                                <th className="text-center px-5 py-4 text-[11px] font-bold text-gray-500 uppercase">Plan</th>
                                <th className="text-center px-5 py-4 text-[11px] font-bold text-gray-500 uppercase">Status</th>
                                <th className="text-center px-5 py-4 text-[11px] font-bold text-gray-500 uppercase">Expires</th>
                                <th className="text-center px-5 py-4 text-[11px] font-bold text-gray-500 uppercase">Created</th>
                                <th className="text-center px-5 py-4 text-[11px] font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTenants.map(t => {
                                const active = isTenantActive(t);
                                const isDisabled = t.plan === "disabled";
                                const daysLeft = t.subscription_ends_at
                                    ? Math.ceil((new Date(t.subscription_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
                                    : null;

                                return (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        {/* Tenant Name */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                                                    <Building2 size={15} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{t.name || "Unnamed"}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{t.id?.slice(0, 10)}...</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Plan Dropdown */}
                                        <td className="px-5 py-4 text-center">
                                            <select
                                                value={t.plan || "starter"}
                                                onChange={(e) => updateTenantPlan(t.id, e.target.value)}
                                                disabled={updatingId === t.id}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer disabled:opacity-50 transition-all ${t.plan === "disabled" ? "bg-red-50 text-red-700 border-red-200" :
                                                        t.plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                                            t.plan === "pro" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                                "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}
                                            >
                                                <option value="starter">Starter</option>
                                                <option value="pro">Pro</option>
                                                <option value="enterprise">Enterprise</option>
                                                <option value="disabled">🔒 Disabled</option>
                                            </select>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-5 py-4 text-center">
                                            {isDisabled ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                                    <Ban size={10} /> Disabled
                                                </span>
                                            ) : active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={10} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                                    <XCircle size={10} /> Expired
                                                </span>
                                            )}
                                        </td>

                                        {/* Expires Date - Clickable */}
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => openDatePicker(t.id, t.subscription_ends_at)}
                                                className="text-sm text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                                            >
                                                <Calendar size={12} />
                                                {t.subscription_ends_at
                                                    ? new Date(t.subscription_ends_at).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })
                                                    : "Set date"}
                                            </button>
                                            {daysLeft !== null && daysLeft > 0 && daysLeft <= 30 && (
                                                <p className={`text-[10px] mt-0.5 font-medium ${daysLeft <= 7 ? "text-red-500" : "text-amber-500"
                                                    }`}>
                                                    {daysLeft} days remaining
                                                </p>
                                            )}
                                        </td>

                                        {/* Created Date */}
                                        <td className="px-5 py-4 text-center text-xs text-gray-400">
                                            {t.created_at
                                                ? new Date(t.created_at).toLocaleDateString()
                                                : "N/A"}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => extendSubscription(t.id, 30)}
                                                    disabled={updatingId === t.id}
                                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 disabled:opacity-50 transition-all"
                                                    title="Extend 30 days"
                                                >
                                                    +30d
                                                </button>
                                                <button
                                                    onClick={() => toggleTenantStatus(t.id)}
                                                    disabled={updatingId === t.id}
                                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border disabled:opacity-50 transition-all ${isDisabled
                                                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                                        }`}
                                                    title={isDisabled ? "Enable tenant" : "Disable tenant"}
                                                >
                                                    {updatingId === t.id ? (
                                                        <Loader2 size={10} className="animate-spin" />
                                                    ) : isDisabled ? (
                                                        "Enable"
                                                    ) : (
                                                        "Disable"
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredTenants.length === 0 && (
                    <div className="py-20 text-center">
                        <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                            {search || filter !== "all" ? "No tenants match your filters" : "No tenants yet"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            {search || filter !== "all" ? "Try adjusting your search or filters" : "Tenants will appear here"}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Showing <strong className="text-gray-700">{filteredTenants.length}</strong> of{" "}
                        <strong className="text-gray-700">{tenants.length}</strong> tenants
                    </p>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
            `}</style>
        </div>
    );
}