"use client";

import ProtectedPage from "@/components/ProtectedPage";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import * as XLSX from "xlsx";
import {
    Search, Download, Upload, Plus, Filter, X, ChevronDown, ChevronUp,
    FileSpreadsheet, Phone, Mail, MapPin, User, Package, Tag, Truck,
    CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, Edit, Eye,
    MoreHorizontal, ArrowUpDown, Calendar, DollarSign, TrendingUp,
    BarChart3, Users, ShoppingCart, ArrowUp, ArrowDown, Zap,
    Copy, ExternalLink, Bell, Settings, ChevronLeft, ChevronRight,
    SlidersHorizontal, Table2, LayoutGrid, Maximize2, Star, Activity,
    AlertTriangle, CheckCheck, Timer, TrendingDown, Loader2,
    Sparkles, Layers, Target, Award, PieChart, History, RotateCcw,
    Store, CreditCard, Wallet, BadgeCheck, Globe, MousePointerClick,
    Smartphone, Building2, MapPinIcon, Hash, ShoppingBag, CheckSquare,
    Square, MinusSquare, Wifi, WifiOff
} from "lucide-react";

/* ================================================================
   CONSTANTS
================================================================ */
const PAGE_SIZES = [25, 50, 100, 200];

const DEFAULT_STATUSES = [
    { value: "new", label: "New", color: "#10b981" },
    { value: "pending", label: "Pending", color: "#f59e0b" },
    { value: "confirmed", label: "Confirmed", color: "#059669" },
    { value: "no_answer", label: "No Answer", color: "#6b7280" },
    { value: "canceled", label: "Canceled", color: "#ef4444" },
    { value: "shipped", label: "Shipped", color: "#047857" },
    { value: "delivered", label: "Delivered", color: "#14b8a6" },
    { value: "returned", label: "Returned", color: "#f97316" },
    { value: "refused", label: "Refused", color: "#dc2626" }
];

const DELIVERY_STATUSES = [
    { value: "", label: "None" },
    { value: "pending", label: "Pending", color: "#6b7280" },
    { value: "shipped", label: "Shipped", color: "#047857" },
    { value: "in_transit", label: "In Transit", color: "#059669" },
    { value: "out_for_delivery", label: "Out for Delivery", color: "#f59e0b" },
    { value: "delivered", label: "Delivered", color: "#10b981" },
    { value: "cancelled", label: "Cancelled", color: "#ef4444" },
    { value: "returned", label: "Returned", color: "#f97316" },
    { value: "failed_attempt", label: "Failed Attempt", color: "#dc2626" },
];

/* ================================================================
   STATUS META CONFIGURATION
================================================================ */
const STATUS_META = {
    new: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "New" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Pending" },
    confirmed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-600", label: "Confirmed" },
    no_answer: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500", label: "No Answer" },
    canceled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Canceled" },
    shipped: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-700", label: "Shipped" },
    delivered: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500", label: "Delivered" },
    returned: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", label: "Returned" },
    refused: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-600", label: "Refused" }
};

const DELIV_META = {
    pending: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-500", label: "Pending" },
    shipped: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-700", label: "Shipped" },
    in_transit: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-600", label: "In Transit" },
    out_for_delivery: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Out for Delivery" },
    delivered: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", label: "Delivered" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Cancelled" },
    returned: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500", label: "Returned" },
    failed_attempt: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-600", label: "Failed Attempt" }
};

/* ================================================================
   STATUS BADGE
================================================================ */
function StatusBadge({ status, meta }) {
    const m = meta[status] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400", label: status || "Unknown" };
    const isActive = status === 'delivered' || status === 'in_transit' || status === 'out_for_delivery';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${m.bg} ${m.text} ${m.border} transition-all duration-200 hover:shadow-sm`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${isActive ? 'animate-pulse ring-2 ring-offset-1 ' + m.dot.replace('bg-', 'ring-') : ''}`} />
            {m.label}
        </span>
    );
}

/* ================================================================
   TOAST
================================================================ */
function useToast() {
    const [toasts, setToasts] = useState([]);
    const add = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }, []);
    return { toasts, add };
}

function ToastContainer({ toasts }) {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl border animate-slide-up backdrop-blur-md transition-all duration-300 ${t.type === "success"
                        ? "bg-emerald-600/95 text-white border-emerald-400/50 shadow-emerald-500/20"
                        : t.type === "info"
                            ? "bg-blue-600/95 text-white border-blue-400/50 shadow-blue-500/20"
                            : "bg-red-600/95 text-white border-red-400/50 shadow-red-500/20"
                    }`}>
                    {t.type === "success" ? <CheckCheck size={16} className="text-emerald-200" /> :
                        t.type === "info" ? <Activity size={16} className="text-blue-200" /> :
                            <AlertTriangle size={16} className="text-red-200" />}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

/* ================================================================
   MODAL
================================================================ */
function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-scale-in overflow-hidden border border-gray-100`}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-emerald-50/30">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90">
                        <X size={18} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-6 custom-scrollbar">{children}</div>
            </div>
        </div>
    );
}

/* ================================================================
   CONFIRMATION DIALOG
================================================================ */
function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden border border-gray-100">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   PRODUCT SELECTOR (Dropdown with search)
================================================================ */
function ProductSelector({ value, onChange, products, className = "" }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    const selected = products.find(p => p.name === value || p.id === value);

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-left flex items-center justify-between hover:border-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 group"
            >
                <span className={selected ? "text-gray-900 font-medium" : "text-gray-400"}>
                    {selected ? selected.name : "Select product..."}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : "group-hover:text-gray-600"}`} />
            </button>

            {open && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        <button
                            onClick={() => { onChange(""); setOpen(false); }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                            <X size={12} /> Clear selection
                        </button>
                        {filtered.map(product => (
                            <button
                                key={product.id}
                                onClick={() => { onChange(product.name); setOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all duration-200 ${selected?.id === product.id
                                        ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={14} className={selected?.id === product.id ? "text-emerald-500" : "text-gray-400"} />
                                    <span>{product.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    {product.sell_price > 0 && <span className="font-medium">${product.sell_price}</span>}
                                    {product.stock_qty > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${product.stock_qty < 10
                                                ? "bg-red-50 text-red-600 border border-red-200"
                                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                            }`}>
                                            {product.stock_qty}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center py-4 text-xs text-gray-400">No products found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ================================================================
   SOURCE SELECTOR
================================================================ */
function SourceSelector({ value, onChange, sources }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const sourceIcons = {
        facebook: Globe, google: Globe, instagram: Globe, tiktok: Globe,
        direct: MousePointerClick, whatsapp: Smartphone, phone: Phone,
        website: Globe, referral: Users, other: Zap
    };

    const Icon = sourceIcons[value?.toLowerCase()] || Globe;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-left flex items-center justify-between hover:border-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 group"
            >
                <div className="flex items-center gap-2">
                    {value ? <Icon size={14} className="text-emerald-500" /> : null}
                    <span className={value ? "text-gray-900 font-medium capitalize" : "text-gray-400"}>{value || "Select source..."}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180 text-emerald-500" : "group-hover:text-gray-600"}`} />
            </button>
            {open && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in">
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        <button onClick={() => { onChange(""); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">Clear</button>
                        {sources.map(source => {
                            const SrcIcon = sourceIcons[source.toLowerCase()] || Globe;
                            return (
                                <button key={source} onClick={() => { onChange(source); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 ${value === source
                                            ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}>
                                    <SrcIcon size={14} className={value === source ? "text-emerald-500" : "text-gray-400"} />
                                    {source}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ================================================================
   DELIVERY HISTORY PANEL
================================================================ */
function DeliveryHistoryPanel({ open, onClose, lead }) {
    if (!open || !lead) return null;

    return (
        <div className="fixed inset-0 z-[300] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-full animate-slide-in-right overflow-y-auto border-l border-gray-100">
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full" />
                            Delivery History
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Tracking: {lead.tracking_number || "N/A"}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:rotate-90">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-200">
                                {(lead.customer || "?")[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{lead.customer}</p>
                                <p className="text-xs text-gray-500">{lead.phone} • {lead.city}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={lead.status} meta={STATUS_META} />
                            {lead.delivery_status && <StatusBadge status={lead.delivery_status} meta={DELIV_META} />}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                                <Truck size={14} className="text-emerald-600" />
                            </div>
                            Shipment Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: "Tracking #", value: lead.tracking_number, icon: Hash },
                                { label: "Company", value: lead.delivery_company || lead.shipping_source, icon: Building2 },
                                { label: "Source", value: lead.shipping_source, icon: Globe },
                                { label: "Status", value: lead.delivery_status, icon: Activity },
                            ].map((item, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-emerald-200 transition-all duration-200">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <item.icon size={11} className="text-emerald-500" />
                                        <p className="text-[10px] text-gray-500 uppercase font-semibold">{item.label}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900 text-xs">{item.value || "—"}</p>
                                </div>
                            ))}
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 col-span-2 hover:border-emerald-200 transition-all duration-200">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Comment</p>
                                <p className="font-semibold text-gray-900 text-xs">{lead.delivery_comment || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
function OrdersContent() {
    const { toasts, add: toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [tenantId, setTenantId] = useState(null);

    const [leads, setLeads] = useState([]);
    const [products, setProducts] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Auto-sync state
    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const realtimeChannelRef = useRef(null);

    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ status: "", delivery_status: "", source: "" });
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showDeliveryPanel, setShowDeliveryPanel] = useState(false);
    const [deliveryPanelLead, setDeliveryPanelLead] = useState(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    const blankLead = { customer: "", phone: "", city: "", source: "", product: "", quantity: 1, amount: "", status: "new", tracking: "" };
    const [newLead, setNewLead] = useState({ ...blankLead });
    const [addLoading, setAddLoading] = useState(false);
    const [editForm, setEditForm] = useState({ customer: "", phone: "", city: "", source: "", product: "", quantity: 1, amount: "", status: "", agent: "", tracking: "", delivery_status: "", delivery_company: "" });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from("user_profiles").select("tenant_id").eq("id", user.id).single();
            if (profile?.tenant_id) setTenantId(profile.tenant_id);
        }
        init();
    }, []);

    const fetchAll = useCallback(async (silent = false) => {
        if (!tenantId) return;
        try {
            if (!silent) setLoading(true); else setRefreshing(true);
            const [leadsRes, productsRes] = await Promise.all([
                supabase.from("leads").select("*").eq("tenant_id", tenantId).order("date", { ascending: false }),
                supabase.from("products").select("*").eq("tenant_id", tenantId).order("name")
            ]);
            if (leadsRes.error) throw leadsRes.error;
            setLeads(leadsRes.data || []);
            setProducts(productsRes.data || []);
            const srcs = [...new Set((leadsRes.data || []).map(l => l.source).filter(Boolean))].sort();
            setSources(srcs);
            setLastSyncTime(new Date());
            // Clear selection after fetch
            setSelectedIds(new Set());
            setSelectAll(false);
        } catch (err) {
            if (!silent) toast(err.message || "Failed to load", "error");
        }
        finally { setLoading(false); setRefreshing(false); }
    }, [tenantId, toast]);

    // Setup real-time subscription
    useEffect(() => {
        if (!tenantId) return;

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`orders-realtime-${tenantId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leads',
                    filter: `tenant_id=eq.${tenantId}`
                },
                (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;

                    setLeads(currentLeads => {
                        switch (eventType) {
                            case 'INSERT':
                                toast(`New order added: ${newRecord.customer || 'Unknown'}`, 'info');
                                return [newRecord, ...currentLeads];

                            case 'UPDATE':
                                toast(`Order updated: ${newRecord.customer || 'Unknown'}`, 'info');
                                return currentLeads.map(lead =>
                                    lead.id === newRecord.id ? newRecord : lead
                                );

                            case 'DELETE':
                                toast(`Order deleted: ${oldRecord.customer || 'Unknown'}`, 'info');
                                return currentLeads.filter(lead => lead.id !== oldRecord.id);

                            default:
                                return currentLeads;
                        }
                    });

                    setLastSyncTime(new Date());
                }
            )
            .subscribe((status) => {
                setIsRealtimeConnected(status === 'SUBSCRIBED');
                if (status === 'SUBSCRIBED') {
                    console.log('Real-time sync connected');
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.log('Real-time sync disconnected');
                }
            });

        realtimeChannelRef.current = channel;

        // Cleanup subscription on unmount
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [tenantId, toast]);

    useEffect(() => { if (tenantId) fetchAll(); }, [fetchAll, tenantId]);

    const filtered = useMemo(() => {
        let r = [...leads];
        if (search) {
            const s = search.toLowerCase();
            r = r.filter(o =>
                (o.customer || "").toLowerCase().includes(s) ||
                (o.phone || "").includes(s) ||
                (o.tracking_number || "").toLowerCase().includes(s)
            );
        }
        if (filters.status) r = r.filter(o => o.status === filters.status);
        if (filters.delivery_status) r = r.filter(o => o.delivery_status === filters.delivery_status);
        if (filters.source) r = r.filter(o => o.source === filters.source);

        r.sort((a, b) => {
            const av = a[sortConfig.key] ?? "";
            const bv = b[sortConfig.key] ?? "";
            if (sortConfig.key === "amount") {
                return sortConfig.direction === "asc" ? (av || 0) - (bv || 0) : (bv || 0) - (av || 0);
            }
            if (sortConfig.key === "date") {
                return sortConfig.direction === "asc" ? new Date(av) - new Date(bv) : new Date(bv) - new Date(av);
            }
            return sortConfig.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
        return r;
    }, [leads, search, filters, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => { setPage(1); }, [search, filters]);

    // Reset selection when page changes
    useEffect(() => {
        setSelectAll(false);
    }, [page, pageSize, search, filters]);

    const kpis = useMemo(() => {
        const t = leads.length;
        const rev = leads.reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
        const conf = leads.filter(o => o.status === "confirmed").length;
        const del = leads.filter(o => o.delivery_status === "delivered").length;
        const pending = leads.filter(o => o.status === "pending" || o.status === "new").length;
        return { total: t, revenue: rev, confirmed: conf, delivered: del, pending };
    }, [leads]);

    const formatCurrency = (v) => {
        return `$${(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Selection handlers
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds(new Set());
            setSelectAll(false);
        } else {
            const allIds = paginated.map(l => l.id);
            setSelectedIds(new Set(allIds));
            setSelectAll(true);
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            setSelectAll(false);
        } else {
            newSelected.add(id);
            if (newSelected.size === paginated.length) {
                setSelectAll(true);
            }
        }
        setSelectedIds(newSelected);
    };

    // Delete handlers
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) {
            toast("No orders selected", "error");
            return;
        }
        setDeleteLoading(true);
        try {
            const ids = Array.from(selectedIds);
            const { error } = await supabase.from("leads").delete().in("id", ids);
            if (error) throw error;
            toast(`Successfully deleted ${ids.length} order${ids.length > 1 ? 's' : ''}!`);
            setSelectedIds(new Set());
            setSelectAll(false);
            setShowDeleteConfirm(false);
        } catch (err) {
            toast("Failed to delete: " + (err.message || "Unknown error"), "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteOne = async (leadId) => {
        setDeleteLoading(true);
        try {
            const { error } = await supabase.from("leads").delete().eq("id", leadId);
            if (error) throw error;
            toast("Order deleted successfully!");
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(leadId);
                return next;
            });
        } catch (err) {
            toast("Failed to delete: " + (err.message || "Unknown error"), "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    /* ── ADD ORDER ────────────────────────────────── */
    const handleAddOrder = async () => {
        if (!newLead.customer || !newLead.phone) {
            toast("Customer name and phone are required.", "error");
            return;
        }
        if (!tenantId) {
            toast("Session error.", "error");
            return;
        }
        setAddLoading(true);
        try {
            const selectedProduct = products.find(p => p.name === newLead.product);
            const { error } = await supabase.from("leads").insert({
                tenant_id: tenantId,
                customer: newLead.customer,
                phone: newLead.phone,
                city: newLead.city || null,
                source: newLead.source || null,
                product: newLead.product || null,
                product_id: selectedProduct?.id || null,
                quantity: parseInt(newLead.quantity) || 1,
                amount: parseFloat(newLead.amount) || (selectedProduct?.sell_price * (parseInt(newLead.quantity) || 1)) || 0,
                status: newLead.status || "new",
                tracking_number: newLead.tracking || null,
                date: new Date().toISOString(),
            });
            if (error) throw error;
            toast("Order added successfully!");
            setShowAddModal(false);
            setNewLead({ ...blankLead });
        } catch (err) {
            toast("Failed: " + (err.message || "Unknown error"), "error");
        }
        finally {
            setAddLoading(false);
        }
    };

    /* ── EDIT ORDER ───────────────────────────────── */
    const openEditModal = (lead) => {
        setSelectedLead(lead);
        setEditForm({
            customer: lead.customer || "",
            phone: lead.phone || "",
            city: lead.city || "",
            source: lead.source || "",
            product: lead.product || "",
            quantity: lead.quantity || 1,
            amount: lead.amount || "",
            status: lead.status || "new",
            delivery_status: lead.delivery_status || "",
            agent: lead.agent || "",
            tracking: lead.tracking_number || "",
            delivery_company: lead.delivery_company || ""
        });
        setShowEditModal(true);
    };

    const handleEditOrder = async () => {
        if (!selectedLead) return;
        setEditLoading(true);
        try {
            const selectedProduct = products.find(p => p.name === editForm.product);
            const { error } = await supabase.from("leads").update({
                customer: editForm.customer,
                phone: editForm.phone,
                city: editForm.city || null,
                source: editForm.source || null,
                product: editForm.product || null,
                product_id: selectedProduct?.id || null,
                quantity: parseInt(editForm.quantity) || 1,
                amount: parseFloat(editForm.amount) || 0,
                status: editForm.status,
                delivery_status: editForm.delivery_status || null,
                tracking_number: editForm.tracking || null,
                delivery_company: editForm.delivery_company || null
            }).eq("id", selectedLead.id);
            if (error) throw error;
            toast("Order updated!");
            setShowEditModal(false);
            setSelectedLead(null);
        } catch (err) {
            toast(err.message, "error");
        }
        finally {
            setEditLoading(false);
        }
    };

    const updateStatus = async (leadId, newStatus) => {
        await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
        toast("Status updated!");
    };

    const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200";
    const selectCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200";

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-xl shadow-emerald-200/50 ring-1 ring-emerald-500/20">
                            <ShoppingBag size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Orders</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm text-gray-500">
                                    {leads.length.toLocaleString()} total orders · {formatCurrency(kpis.revenue)} revenue
                                </p>
                                {/* Real-time connection indicator */}
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {isRealtimeConnected ? 'Live' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            {lastSyncTime && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    Last sync: {lastSyncTime.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Selection actions */}
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl animate-scale-in">
                                <span className="text-sm font-semibold text-emerald-700">
                                    {selectedIds.size} selected
                                </span>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-200"
                                >
                                    <Trash2 size={12} />
                                    Delete
                                </button>
                                <button
                                    onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}
                                    className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-white text-xs font-semibold text-gray-600 transition-all duration-200"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => fetchAll(true)}
                            disabled={refreshing}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-emerald-300 shadow-sm transition-all duration-200 disabled:opacity-50"
                            title="Manual refresh"
                        >
                            <RefreshCw size={16} className={`text-gray-500 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold shadow-lg shadow-emerald-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-300/50 active:scale-95"
                        >
                            <Plus size={16} />Add Order
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: "Total", value: kpis.total, icon: ShoppingCart, color: "#10b981", bg: "bg-emerald-50" },
                        { label: "Revenue", value: formatCurrency(kpis.revenue), icon: DollarSign, color: "#059669", bg: "bg-green-50" },
                        { label: "Confirmed", value: kpis.confirmed, icon: CheckCircle, color: "#047857", bg: "bg-emerald-50" },
                        { label: "Delivered", value: kpis.delivered, icon: Truck, color: "#14b8a6", bg: "bg-teal-50" },
                        { label: "Pending", value: kpis.pending, icon: Clock, color: "#f59e0b", bg: "bg-amber-50" }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-200 group cursor-default">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-2 rounded-lg ${kpi.bg} transition-transform duration-200 group-hover:scale-110`}>
                                    <kpi.icon size={14} style={{ color: kpi.color }} />
                                </div>
                            </div>
                            <p className="text-xl font-bold text-gray-900 tracking-tight">{kpi.value}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">{kpi.label}</p>
                        </div>
                    ))}
                </div>

                {/* FILTERS */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <select
                            value={filters.status}
                            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                            className={selectCls}
                        >
                            <option value="">All Statuses</option>
                            {DEFAULT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select
                            value={filters.delivery_status}
                            onChange={e => setFilters(p => ({ ...p, delivery_status: e.target.value }))}
                            className={selectCls}
                        >
                            <option value="">All Delivery</option>
                            {DELIVERY_STATUSES.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select
                            value={filters.source}
                            onChange={e => setFilters(p => ({ ...p, source: e.target.value }))}
                            className={selectCls}
                        >
                            <option value="">All Sources</option>
                            {sources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {(search || filters.status || filters.delivery_status || filters.source) && (
                            <button
                                onClick={() => { setSearch(""); setFilters({ status: "", delivery_status: "", source: "" }); }}
                                className="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50/80 to-emerald-50/30 border-b border-gray-100">
                                    <th className="px-4 py-3.5 text-left w-10">
                                        <button
                                            onClick={handleSelectAll}
                                            className="p-1 rounded-md hover:bg-emerald-100 transition-colors"
                                        >
                                            {selectAll ? (
                                                <CheckSquare size={16} className="text-emerald-600" />
                                            ) : selectedIds.size > 0 ? (
                                                <MinusSquare size={16} className="text-emerald-400" />
                                            ) : (
                                                <Square size={16} className="text-gray-300" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th className="px-4 py-3.5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Delivery</th>
                                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tracking</th>
                                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">History</th>
                                    <th className="px-4 py-3.5 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider w-20">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="py-20 text-center">
                                            <div className="relative">
                                                <Loader2 size={28} className="text-emerald-500 animate-spin mx-auto mb-3" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                            </div>
                                            <p className="text-sm text-gray-500">Loading orders...</p>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="py-20 text-center">
                                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <ShoppingBag size={28} className="text-emerald-300" />
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">No orders found</p>
                                            <p className="text-xs text-gray-400 mt-1">{search || filters.status ? "Try adjusting filters" : "Click Add Order to create one"}</p>
                                        </td>
                                    </tr>
                                ) : paginated.map(lead => {
                                    const isSelected = selectedIds.has(lead.id);
                                    return (
                                        <tr
                                            key={lead.id}
                                            className={`group transition-all duration-200 ${isSelected
                                                    ? "bg-emerald-50/50 border-l-2 border-l-emerald-500"
                                                    : "hover:bg-emerald-50/20"
                                                }`}
                                        >
                                            <td className="px-4 py-3.5">
                                                <button
                                                    onClick={() => handleSelectOne(lead.id)}
                                                    className="p-1 rounded-md hover:bg-emerald-100 transition-colors"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare size={16} className="text-emerald-600" />
                                                    ) : (
                                                        <Square size={16} className="text-gray-300 group-hover:text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                                                        {(lead.customer || "?")[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{lead.customer || "—"}</p>
                                                        {lead.city && <p className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin size={10} />{lead.city}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-sm text-gray-600 font-mono">{lead.phone || "—"}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Package size={12} className="text-gray-400 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700 max-w-[140px] truncate">{lead.product || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[2rem] h-8 rounded-lg bg-gray-100 text-xs font-bold text-gray-700 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                                                    {lead.quantity || 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className="font-bold text-gray-900 tabular-nums">${(lead.amount || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="relative group/status inline-block">
                                                    <StatusBadge status={lead.status} meta={STATUS_META} />
                                                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 hidden group-hover/status:block bg-white border border-gray-200 rounded-xl p-1.5 shadow-xl min-w-[140px] animate-scale-in">
                                                        {DEFAULT_STATUSES.map(s => (
                                                            <button
                                                                key={s.value}
                                                                onClick={() => updateStatus(lead.id, s.value)}
                                                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                                {s.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                {lead.delivery_status ? <StatusBadge status={lead.delivery_status} meta={DELIV_META} /> : <span className="text-xs text-gray-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-gray-500 font-mono">{lead.tracking_number || "—"}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <button
                                                    onClick={() => { setDeliveryPanelLead(lead); setShowDeliveryPanel(true); }}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all duration-200 hover:scale-110"
                                                >
                                                    <History size={15} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(lead)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOne(lead.id)}
                                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {!loading && filtered.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-emerald-50/20">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    Showing <strong className="text-gray-700">{Math.min(((page - 1) * pageSize) + 1, filtered.length)}-{Math.min(page * pageSize, filtered.length)}</strong> of <strong className="text-gray-700">{filtered.length}</strong>
                                </span>
                                <select
                                    value={pageSize}
                                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white hover:border-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors"
                                >
                                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}/page</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 disabled:opacity-30 transition-all duration-200">
                                    <ChevronLeft size={14} />
                                </button>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 disabled:opacity-30 transition-all duration-200">
                                    <ChevronLeft size={14} />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                                    return (
                                        <button key={pg} onClick={() => setPage(pg)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-all duration-200 ${page === pg ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "text-gray-500 hover:bg-white hover:shadow-sm"
                                            }`}>{pg}</button>
                                    );
                                })}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 disabled:opacity-30 transition-all duration-200">
                                    <ChevronRight size={14} />
                                </button>
                                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-400 disabled:opacity-30 transition-all duration-200">
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD MODAL */}
            <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setNewLead({ ...blankLead }); }} title="Add New Order" maxWidth="max-w-2xl">
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Customer Name *</label>
                            <input className={inputCls} placeholder="Full name" value={newLead.customer} onChange={e => setNewLead(p => ({ ...p, customer: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone *</label>
                            <input className={inputCls} placeholder="+212 600 000 000" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">City</label>
                            <input className={inputCls} placeholder="City" value={newLead.city} onChange={e => setNewLead(p => ({ ...p, city: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Source</label>
                            <SourceSelector value={newLead.source} onChange={v => setNewLead(p => ({ ...p, source: v }))} sources={sources} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Product</label>
                            <ProductSelector value={newLead.product} onChange={v => {
                                const prod = products.find(p => p.name === v);
                                setNewLead(p => ({ ...p, product: v, amount: prod?.sell_price ? (prod.sell_price * (p.quantity || 1)).toString() : p.amount }));
                            }} products={products} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Quantity</label>
                            <input type="number" className={inputCls} min="1" value={newLead.quantity}
                                onChange={e => {
                                    const qty = parseInt(e.target.value) || 1;
                                    const prod = products.find(p => p.name === newLead.product);
                                    setNewLead(p => ({ ...p, quantity: qty, amount: prod?.sell_price ? (prod.sell_price * qty).toString() : p.amount }));
                                }} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Amount</label>
                            <input type="number" className={inputCls} placeholder="0.00" step="0.01" value={newLead.amount} onChange={e => setNewLead(p => ({ ...p, amount: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
                            <select className={selectCls} value={newLead.status} onChange={e => setNewLead(p => ({ ...p, status: e.target.value }))}>
                                {DEFAULT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tracking #</label>
                            <input className={inputCls} placeholder="Tracking number" value={newLead.tracking} onChange={e => setNewLead(p => ({ ...p, tracking: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => { setShowAddModal(false); setNewLead({ ...blankLead }); }}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddOrder}
                            disabled={addLoading || !newLead.customer || !newLead.phone}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-300/50 active:scale-95"
                        >
                            {addLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
                            Add Order
                        </button>
                    </div>
                </div>
            </Modal>

            {/* EDIT MODAL */}
            <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedLead(null); }} title="Edit Order" maxWidth="max-w-2xl">
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Customer Name</label>
                            <input className={inputCls} value={editForm.customer} onChange={e => setEditForm(p => ({ ...p, customer: e.target.value }))} />
                        </div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label><input className={inputCls} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">City</label><input className={inputCls} value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Source</label><SourceSelector value={editForm.source} onChange={v => setEditForm(p => ({ ...p, source: v }))} sources={sources} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Product</label><ProductSelector value={editForm.product} onChange={v => setEditForm(p => ({ ...p, product: v }))} products={products} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Quantity</label><input type="number" className={inputCls} min="1" value={editForm.quantity} onChange={e => setEditForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Amount</label><input type="number" className={inputCls} step="0.01" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label><select className={selectCls} value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>{DEFAULT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Delivery</label><select className={selectCls} value={editForm.delivery_status} onChange={e => setEditForm(p => ({ ...p, delivery_status: e.target.value }))}>{DELIVERY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tracking #</label><input className={inputCls} value={editForm.tracking} onChange={e => setEditForm(p => ({ ...p, tracking: e.target.value }))} /></div>
                        <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Delivery Company</label><input className={inputCls} value={editForm.delivery_company} onChange={e => setEditForm(p => ({ ...p, delivery_company: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => { setShowEditModal(false); setSelectedLead(null); }}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEditOrder}
                            disabled={editLoading}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-300/50 active:scale-95"
                        >
                            {editLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>

            {/* DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Orders"
                message={`Are you sure you want to delete ${selectedIds.size} order${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
                loading={deleteLoading}
            />

            {/* DELIVERY HISTORY PANEL */}
            <DeliveryHistoryPanel open={showDeliveryPanel} onClose={() => { setShowDeliveryPanel(false); setDeliveryPanelLead(null); }} lead={deliveryPanelLead} />

            <ToastContainer toasts={toasts} />

            <style jsx global>{`
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #10b981; }
                
                .tabular-nums { font-variant-numeric: tabular-nums; }
            `}</style>
        </div>
    );
}

export default function OrdersPage() {
    return (
        <ProtectedPage page="leads">
            <OrdersContent />
        </ProtectedPage>
    );
}