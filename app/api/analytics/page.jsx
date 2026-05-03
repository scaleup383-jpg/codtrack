"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Crown,
    Calendar,
    Activity,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Trash2,
    Edit,
    MoreHorizontal,
    Users,
    Zap,
    Shield,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    BarChart3,
    Download,
    Plus,
    ArrowUpDown
} from "lucide-react";

type Tenant = {
    id: string;
    name: string;
    plan: string;
    subscription_ends_at: string;
    is_active: boolean;
    user_count?: number;
    usage_percentage?: number;
    last_active?: string;
};

type SortField = 'name' | 'plan' | 'subscription_ends_at' | 'is_active';
type SortDirection = 'asc' | 'desc';

export default function AdminTenants() {
    const [tenants, setTenants] = useState < Tenant[] > ([]);
    const [filteredTenants, setFilteredTenants] = useState < Tenant[] > ([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState < "all" | "active" | "disabled" | "expiring" > ("all");
    const [planFilter, setPlanFilter] = useState < string > ("all");
    const [sortField, setSortField] = useState < SortField > ("name");
    const [sortDirection, setSortDirection] = useState < SortDirection > ("asc");
    const [selectedTenant, setSelectedTenant] = useState < string | null > (null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const fetchTenants = useCallback(async () => {
        setIsRefreshing(true);
        const { data } = await supabase.from("tenants").select("*");
        const enrichedData = (data || []).map(tenant => ({
            ...tenant,
            user_count: Math.floor(Math.random() * 100) + 1,
            usage_percentage: Math.floor(Math.random() * 100),
            last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
        setTenants(enrichedData);
        setLoading(false);
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    useEffect(() => {
        let filtered = [...tenants];

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            if (statusFilter === "expiring") {
                filtered = filtered.filter(t => {
                    const endDate = new Date(t.subscription_ends_at);
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    return t.is_active && endDate <= thirtyDaysFromNow;
                });
            } else {
                filtered = filtered.filter(t =>
                    statusFilter === "active" ? t.is_active : !t.is_active
                );
            }
        }

        if (planFilter !== "all") {
            filtered = filtered.filter(t => t.plan === planFilter);
        }

        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'plan':
                    comparison = a.plan.localeCompare(b.plan);
                    break;
                case 'subscription_ends_at':
                    comparison = new Date(a.subscription_ends_at).getTime() - new Date(b.subscription_ends_at).getTime();
                    break;
                case 'is_active':
                    comparison = (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        setFilteredTenants(filtered);
    }, [tenants, searchTerm, statusFilter, planFilter, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan?.toLowerCase()) {
            case 'enterprise': return 'from-green-600 to-green-800';
            case 'business': return 'from-green-500 to-green-700';
            case 'professional': return 'from-green-400 to-green-600';
            default: return 'from-green-300 to-green-500';
        }
    };

    const getStatusBadge = (isActive: boolean, endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        if (!isActive) {
            return { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, text: "Disabled" };
        } else if (end <= now) {
            return { color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, text: "Expired" };
        } else if (end <= thirtyDaysFromNow) {
            return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock, text: "Expiring Soon" };
        } else {
            return { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2, text: "Active" };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16"
                >
                    <div className="w-full h-full rounded-full border-4 border-green-200 border-t-green-600" />
                </motion.div>
            </div>
        );
    }

    const plans = Array.from(new Set(tenants.map(t => t.plan)));

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-green-100/50 to-white rounded-3xl -m-6" />
                    <div className="relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200"
                                >
                                    <Building2 className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
                                        Tenants Control
                                    </h1>
                                    <p className="text-gray-600 mt-1">Manage and monitor your multi-tenant platform</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={fetchTenants}
                                    className="p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
                                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transition-all flex items-center space-x-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Tenant</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                >
                    {[
                        { label: "Total Tenants", value: tenants.length, icon: Building2, trend: "+12%", color: "from-green-500 to-green-600" },
                        { label: "Active", value: tenants.filter(t => t.is_active).length, icon: TrendingUp, trend: "+8%", color: "from-green-600 to-green-700" },
                        {
                            label: "Expiring Soon", value: tenants.filter(t => {
                                const end = new Date(t.subscription_ends_at);
                                const thirtyDays = new Date();
                                thirtyDays.setDate(thirtyDays.getDate() + 30);
                                return t.is_active && end <= thirtyDays;
                            }).length, icon: Clock, trend: "-3%", color: "from-yellow-500 to-yellow-600"
                        },
                        { label: "Disabled", value: tenants.filter(t => !t.is_active).length, icon: TrendingDown, trend: "-2%", color: "from-red-500 to-red-600" }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
                            className="bg-white rounded-2xl p-6 border border-green-100 hover:border-green-200 transition-all shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    {stat.trend}
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-green-100 p-6 mb-8 shadow-sm"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                            <input
                                type="text"
                                placeholder="Search tenants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50/50 transition-all"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-3 rounded-xl border border-green-200 text-gray-700 hover:bg-green-50 transition-colors flex items-center space-x-2"
                        >
                            <Filter className="w-5 h-5 text-green-600" />
                            <span>Filters</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </motion.button>

                        <div className="flex space-x-2">
                            {["all", "active", "disabled", "expiring"].map((status) => (
                                <motion.button
                                    key={status}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStatusFilter(status as any)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                            ? "bg-green-600 text-white shadow-md"
                                            : "bg-green-50 text-green-700 hover:bg-green-100"
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 pt-6 border-t border-green-100"
                        >
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                                    <select
                                        value={planFilter}
                                        onChange={(e) => setPlanFilter(e.target.value)}
                                        className="px-4 py-2 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="all">All Plans</option>
                                        {plans.map(plan => (
                                            <option key={plan} value={plan}>{plan}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-green-50 to-green-100/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-800">
                                        <button onClick={() => handleSort('name')} className="flex items-center space-x-1 hover:text-green-600">
                                            <span>Name</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-800">
                                        <button onClick={() => handleSort('plan')} className="flex items-center space-x-1 hover:text-green-600">
                                            <span>Plan</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-800">
                                        <button onClick={() => handleSort('subscription_ends_at')} className="flex items-center space-x-1 hover:text-green-600">
                                            <span>Expires</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-800">Users</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-800">Usage</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-800">
                                        <button onClick={() => handleSort('is_active')} className="flex items-center space-x-1 hover:text-green-600">
                                            <span>Status</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-green-800">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredTenants.map((tenant, index) => {
                                        const status = getStatusBadge(tenant.is_active, tenant.subscription_ends_at);
                                        const StatusIcon = status.icon;

                                        return (
                                            <motion.tr
                                                key={tenant.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ backgroundColor: "#f0fdf4" }}
                                                className="border-b border-green-50 hover:bg-green-50/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedTenant(selectedTenant === tenant.id ? null : tenant.id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getPlanColor(tenant.plan)} flex items-center justify-center shadow-md`}>
                                                            <Building2 className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{tenant.name}</p>
                                                            <p className="text-xs text-gray-500">Last active: {new Date(tenant.last_active!).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getPlanColor(tenant.plan)} text-white shadow-sm`}>
                                                        <Crown className="w-3 h-3 mr-1" />
                                                        {tenant.plan}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm text-gray-900">
                                                            {new Date(tenant.subscription_ends_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Users className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm font-medium text-gray-900">{tenant.user_count}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex-1 max-w-[100px]">
                                                            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${tenant.usage_percentage}%` }}
                                                                    className={`h-full rounded-full bg-gradient-to-r from-green-500 to-green-600`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{tenant.usage_percentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {filteredTenants.length === 0 && (
                        <div className="text-center py-12">
                            <Building2 className="w-16 h-16 text-green-200 mx-auto mb-4" />
                            <p className="text-lg text-gray-500">No tenants found</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}